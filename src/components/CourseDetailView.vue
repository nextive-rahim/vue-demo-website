<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';
import CourseCheckout from './CourseCheckout.vue';
import ExamPlayer from './ExamPlayer.vue';

const props = defineProps({
    courseId: { type: [Number, String], required: true },
    initialExamId: { type: [Number, String], default: null },
    checkout: { type: Boolean, default: false },
    user: { type: Object, default: null },
    backLabel: { type: String, default: 'All courses' },
});

const emit = defineEmits(['back', 'login', 'open-exam', 'close-exam', 'open-checkout', 'close-checkout', 'enrolled']);

const course = ref(null);
const loading = ref(true);
const error = ref(null);

// The exam page and checkout form are owned by App.vue so that each is a browser
// history entry — this view just reflects what it's told to show.
const checkingOut = computed(() => props.checkout);
const enrolling = ref(false);
const enrollError = ref(null);

// The current student's access + enrollment status for this course.
const isEnrolled = computed(() => course.value?.is_enrolled === true);
const enrollment = computed(() => course.value?.enrollment ?? null);
const isPending = computed(() => enrollment.value?.status === 'pending');
const isRejected = computed(() => enrollment.value?.status === 'rejected');

const price = computed(() => course.value?.effective_price ?? course.value?.price ?? 0);
const isFree = computed(() => course.value?.is_free === true || price.value === 0);
const discountPercent = computed(() => {
    const p = course.value?.price;
    const d = course.value?.discount_price;
    return p && d && d < p ? Math.round((1 - d / p) * 100) : 0;
});

// Admin-authored HTML "about this course" details; falls back to the summary.
const overviewHtml = computed(() => (course.value?.overview ?? '').trim());
const hasOverview = computed(() => overviewHtml.value.length > 0);

// A short "what's included" summary derived from the content types.
const includes = computed(() => {
    const counts = {};
    for (const item of course.value?.contents ?? []) {
        counts[item.type] = (counts[item.type] ?? 0) + 1;
    }
    const labels = { note: 'notes', pdf: 'PDFs', video: 'video lessons', live: 'live classes', link: 'resources', exam: 'exams' };
    return Object.entries(counts).map(([type, n]) => ({ type, text: `${n} ${labels[type] ?? type}` }));
});

/** Begin enrollment: prompt login, instantly enroll for free courses, else open checkout. */
async function startEnroll() {
    if (!props.user) {
        emit('login');
        return;
    }
    if (isFree.value) {
        await enrollFree();
        return;
    }
    emit('open-checkout');
}

/** Free courses skip checkout and enroll immediately. */
async function enrollFree() {
    enrolling.value = true;
    enrollError.value = null;
    try {
        await api.enroll(props.courseId, {});
        await load();
    } catch (e) {
        enrollError.value = 'Could not enroll. Please try again.';
    } finally {
        enrolling.value = false;
    }
}

/** Payment submitted from the checkout form — refresh to reflect the pending status. */
async function onEnrollmentSubmitted() {
    emit('enrolled');
    await load();
}

// Step 3 state: the content item the user clicked and its freshly-loaded data.
const selectedId = ref(null);
const selectedContent = ref(null);
const contentLoading = ref(false);
const contentError = ref(null);

async function load() {
    loading.value = true;
    error.value = null;
    try {
        course.value = (await api.course(props.courseId)).data;
        autoOpenExam();
    } catch (e) {
        error.value = 'Could not load this course.';
    } finally {
        loading.value = false;
    }
}

/** Jump straight into a specific exam's detail page (e.g. from "Today's Live"). */
function autoOpenExam() {
    if (!props.initialExamId || !course.value) {
        return;
    }
    const item = course.value.contents?.find((c) => String(c.id) === String(props.initialExamId));
    examItem.value = item ?? { id: props.initialExamId, type: 'exam' };
}

/** Step 3: fetch one content item's full data from the dedicated endpoint. */
async function openContent(item) {
    // Toggle: clicking the already-open lesson collapses it.
    if (selectedId.value === item.id) {
        selectedId.value = null;
        selectedContent.value = null;
        return;
    }

    selectedId.value = item.id;
    selectedContent.value = null;
    contentError.value = null;
    contentLoading.value = true;
    try {
        selectedContent.value = (await api.courseContent(props.courseId, item.id)).data;
    } catch (e) {
        contentError.value = 'Could not load this lesson.';
    } finally {
        contentLoading.value = false;
    }
}

// Exams open as a dedicated full page (detail → take → analysis), not inline.
// App.vue drives which one via `initialExamId`, so Back closes it.
const examItem = ref(null);

function openExam(item) {
    emit('open-exam', item.id);
}

function closeExam() {
    emit('close-exam');
}

/**
 * Which sub-page is on screen. Driving the <Transition> off this means the
 * lessons list doesn't re-animate when a lesson is expanded inline.
 */
const pageKey = computed(() => {
    if (examItem.value) return `exam-${examItem.value.id}`;
    if (checkingOut.value) return 'checkout';
    return isEnrolled.value ? 'lessons' : 'landing';
});

const typeMeta = {
    note: { label: 'Note', icon: '📝', color: 'bg-amber-100 text-amber-700' },
    pdf: { label: 'PDF', icon: '📄', color: 'bg-red-100 text-red-700' },
    exam: { label: 'Exam', icon: '🎯', color: 'bg-purple-100 text-purple-700' },
    video: { label: 'Video', icon: '🎬', color: 'bg-blue-100 text-blue-700' },
    live: { label: 'Live', icon: '🔴', color: 'bg-rose-100 text-rose-700' },
    link: { label: 'Link', icon: '🔗', color: 'bg-slate-100 text-slate-700' },
};

function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleString();
}

/**
 * Convert a YouTube/Vimeo URL into an embeddable player URL so the video plays
 * inline on the site. Returns null for anything we can't embed (caller falls
 * back to an external link).
 */
function embedUrl(url) {
    if (!url) return null;

    const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    if (youtube) {
        return `https://www.youtube.com/embed/${youtube[1]}`;
    }

    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) {
        return `https://player.vimeo.com/video/${vimeo[1]}`;
    }

    return null;
}

onMounted(load);

// Re-fetch when opening a different course (the view is cached via <KeepAlive>).
watch(() => props.courseId, () => {
    selectedId.value = null;
    selectedContent.value = null;
    examItem.value = null;
    enrollError.value = null;
    load();
});

// Jump into (or out of) a specific exam when navigated with an exam id.
watch(() => props.initialExamId, (id) => {
    if (id) {
        autoOpenExam();
    } else {
        examItem.value = null;
    }
});
</script>

<template>
    <div class="relative mx-auto px-5 py-14 sm:px-6" :class="!isEnrolled && !examItem && !checkingOut ? 'max-w-6xl' : 'max-w-3xl'">
        <div class="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-200/50 to-violet-200/50 blur-3xl"></div>

        <div class="relative mb-8 flex flex-wrap items-center gap-x-6 gap-y-2">
            <button class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="emit('back')">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                {{ backLabel }}
            </button>
            <button v-if="examItem" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="closeExam">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                Back to course
            </button>
        </div>

        <AlertMessage type="error" :message="error" class="relative mb-6" />

        <!-- Cross-fade between the view's sub-pages (landing / checkout / lessons / exam). -->
        <Transition name="page" mode="out-in">
        <div v-if="loading" key="loading" class="relative py-16 text-center text-slate-400">Loading…</div>

        <div v-else-if="course" :key="pageKey" class="relative">
            <!-- Exam full page: detail → take → analysis -->
            <div v-if="examItem">
                <div v-if="!user" class="rounded-3xl border border-indigo-100 bg-indigo-50 px-6 py-12 text-center">
                    <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">🔒</div>
                    <p class="mt-4 text-lg font-bold text-slate-900">Log in to take this exam</p>
                    <p class="mt-1 text-sm text-slate-500">You need an account to start the exam and see your analysis.</p>
                    <button class="mt-5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5" @click="emit('login')">Log in to start</button>
                </div>
                <ExamPlayer v-else :key="examItem.id" :course-id="courseId" :content-id="examItem.id" />
            </div>

            <!-- Checkout: manual mobile-payment form -->
            <CourseCheckout
                v-else-if="checkingOut"
                :course="course"
                @back="emit('close-checkout')"
                @submitted="onEnrollmentSubmitted"
            />

            <!-- Sales landing: shown until the student has an approved enrollment -->
            <template v-else-if="!isEnrolled">
                <!-- Hero -->
                <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-7 text-white shadow-xl shadow-indigo-500/20 sm:p-10">
                    <div class="pointer-events-none absolute inset-0 opacity-30">
                        <div class="animate-blob absolute -left-10 -top-12 h-56 w-56 rounded-full bg-white/20 blur-3xl"></div>
                        <div class="animate-blob absolute -bottom-16 right-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" style="animation-delay: -5s"></div>
                    </div>
                    <div class="relative grid gap-8 lg:grid-cols-5 lg:items-center">
                        <div class="lg:col-span-3">
                            <nav class="flex items-center gap-2 text-xs font-medium text-white/70">
                                <span>Courses</span>
                                <span>/</span>
                                <span class="truncate text-white/90">{{ course.title }}</span>
                            </nav>
                            <div class="mt-4 flex flex-wrap items-center gap-2">
                                <span class="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-inset ring-white/25 backdrop-blur">Course</span>
                                <span v-if="discountPercent" class="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950">{{ discountPercent }}% OFF</span>
                            </div>
                            <h1 class="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{{ course.title }}</h1>
                            <p class="mt-3 max-w-xl text-base text-white/85 sm:text-lg">{{ course.description }}</p>
                            <div class="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                                <span v-if="course.rating" class="inline-flex items-center gap-1.5 font-semibold">
                                    <span class="text-amber-300">★</span> {{ course.rating }}
                                    <span class="font-normal text-white/70">({{ course.rating_count?.toLocaleString?.() ?? course.rating_count }})</span>
                                </span>
                                <span class="inline-flex items-center gap-1.5 text-white/85">
                                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V6a2 2 0 012-2h9l5 5v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" stroke-linejoin="round" /></svg>
                                    {{ course.contents.length }} lessons
                                </span>
                                <span v-if="course.instructor_name" class="inline-flex items-center gap-2 text-white/85">
                                    <img v-if="course.instructor_image_url" :src="course.instructor_image_url" :alt="course.instructor_name" class="h-6 w-6 rounded-full object-cover ring-1 ring-white/40" />
                                    {{ course.instructor_name }}
                                </span>
                            </div>
                        </div>
                        <div class="lg:col-span-2">
                            <div class="relative aspect-video overflow-hidden rounded-2xl ring-1 ring-white/25">
                                <img v-if="course.thumbnail_url" :src="course.thumbnail_url" :alt="course.title" class="h-full w-full object-cover" />
                                <div v-else class="flex h-full w-full items-center justify-center bg-white/10 text-5xl backdrop-blur">🎓</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Body: content + sticky enroll card -->
                <div class="mt-8 grid gap-8 lg:grid-cols-3 lg:items-start">
                    <div class="space-y-6 lg:col-span-2">
                        <!-- About this course (rich HTML) -->
                        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 class="text-lg font-black tracking-tight text-slate-900">About this course</h2>
                            <div v-if="hasOverview" class="rich-text mt-4" v-html="overviewHtml"></div>
                            <p v-else class="mt-4 whitespace-pre-line text-slate-600">{{ course.description || 'No description provided yet.' }}</p>
                        </section>

                        <!-- What's included -->
                        <section v-if="includes.length" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 class="text-lg font-black tracking-tight text-slate-900">What's included</h2>
                            <ul class="mt-4 grid gap-3 sm:grid-cols-2">
                                <li v-for="inc in includes" :key="inc.type" class="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
                                    <span class="flex h-8 w-8 items-center justify-center rounded-lg text-base" :class="typeMeta[inc.type]?.color">{{ typeMeta[inc.type]?.icon }}</span>
                                    {{ inc.text }}
                                </li>
                            </ul>
                        </section>

                        <!-- Curriculum preview (locked) -->
                        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div class="flex items-center justify-between">
                                <h2 class="text-lg font-black tracking-tight text-slate-900">Course content</h2>
                                <span class="text-xs font-semibold text-slate-400">{{ course.contents.length }} lessons</span>
                            </div>
                            <ul class="mt-4 divide-y divide-slate-100">
                                <li v-for="item in course.contents" :key="item.id" class="flex items-center gap-3 py-3">
                                    <span class="flex h-9 w-9 items-center justify-center rounded-lg text-base" :class="typeMeta[item.type]?.color">{{ typeMeta[item.type]?.icon }}</span>
                                    <div class="min-w-0 flex-1">
                                        <p class="truncate text-sm font-medium text-slate-700">{{ item.title }}</p>
                                        <p class="text-xs uppercase tracking-wide text-slate-400">{{ typeMeta[item.type]?.label }}</p>
                                    </div>
                                    <svg class="h-4 w-4 shrink-0 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" stroke-linecap="round" /></svg>
                                </li>
                                <li v-if="!course.contents.length" class="py-6 text-center text-sm text-slate-400">No lessons yet.</li>
                            </ul>
                        </section>

                        <!-- Instructor -->
                        <section v-if="course.instructor_name" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 class="text-lg font-black tracking-tight text-slate-900">Your instructor</h2>
                            <div class="mt-4 flex items-center gap-4">
                                <img v-if="course.instructor_image_url" :src="course.instructor_image_url" :alt="course.instructor_name" class="h-14 w-14 rounded-full object-cover ring-1 ring-slate-200" />
                                <div v-else class="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">{{ course.instructor_name.charAt(0) }}</div>
                                <div>
                                    <p class="font-bold text-slate-900">{{ course.instructor_name }}</p>
                                    <p v-if="course.instructor_title" class="text-sm text-slate-500">{{ course.instructor_title }}</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <!-- Sticky pricing / enroll card -->
                    <aside class="lg:sticky lg:top-6">
                        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                            <div class="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white p-6">
                                <div class="flex items-end gap-2.5">
                                    <span v-if="isFree" class="text-4xl font-black text-emerald-600">Free</span>
                                    <template v-else>
                                        <span class="text-4xl font-black text-slate-900">৳{{ price.toLocaleString() }}</span>
                                        <span v-if="discountPercent" class="pb-1 text-base text-slate-400 line-through">৳{{ course.price.toLocaleString() }}</span>
                                    </template>
                                </div>
                                <p v-if="discountPercent" class="mt-1 text-sm font-semibold text-emerald-600">Save {{ discountPercent }}% — limited time offer</p>
                            </div>

                            <div class="p-6">
                                <AlertMessage type="error" :message="enrollError" class="mb-4" />

                                <!-- Pending review -->
                                <div v-if="isPending" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-center">
                                    <div class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-sm">⏳</div>
                                    <p class="mt-2 font-bold text-amber-800">Payment under review</p>
                                    <p class="mt-1 text-sm text-amber-700">We're verifying your payment. You'll get access as soon as an admin approves it.</p>
                                </div>

                                <!-- Enroll / resubmit -->
                                <template v-else>
                                    <div v-if="isRejected" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        Your previous submission was declined. Please double-check the details and try again.
                                    </div>
                                    <button
                                        class="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-60"
                                        :disabled="enrolling"
                                        @click="startEnroll"
                                    >
                                        {{ enrolling ? 'Enrolling…' : (isFree ? 'Enroll for free' : (isRejected ? 'Re-submit payment' : 'Enroll now')) }}
                                    </button>
                                    <p class="mt-2 text-center text-xs text-slate-400">{{ user ? 'Instant access after approval' : "You'll be asked to log in first" }}</p>
                                </template>

                                <ul class="mt-6 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
                                    <li class="flex items-center gap-2.5">
                                        <svg class="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                                        Full lifetime access
                                    </li>
                                    <li class="flex items-center gap-2.5">
                                        <svg class="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                                        {{ course.contents.length }} lessons across every module
                                    </li>
                                    <li class="flex items-center gap-2.5">
                                        <svg class="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                                        Pay easily with bKash, Nagad or Rocket
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </aside>
                </div>
            </template>

            <!-- Enrolled: full lessons -->
            <template v-else>
            <span class="text-sm font-bold uppercase tracking-widest text-indigo-500">Course</span>
            <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-900 lg:text-4xl">{{ course.title }}</h1>
            <p class="mt-3 text-lg text-slate-500">{{ course.description }}</p>
            <div class="mt-4 flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-100">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    Enrolled
                </span>
                <span class="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-100">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V6a2 2 0 012-2h9l5 5v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" stroke-linejoin="round" /></svg>
                    {{ course.contents.length }} lessons
                </span>
            </div>

            <!-- Step 2: list of content names. Click one to load its data (step 3). -->
            <ul class="mt-8 space-y-3">
                <li
                    v-for="item in course.contents"
                    :key="item.id"
                    class="overflow-hidden rounded-xl border bg-white"
                    :class="selectedId === item.id ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'"
                >
                    <button class="flex w-full items-center gap-3 p-5 text-left hover:bg-slate-50" @click="item.type === 'exam' ? openExam(item) : openContent(item)">
                        <span class="flex h-9 w-9 items-center justify-center rounded-lg text-lg" :class="typeMeta[item.type]?.color">
                            {{ typeMeta[item.type]?.icon }}
                        </span>
                        <div class="flex-1">
                            <p class="font-semibold text-slate-900">{{ item.title }}</p>
                            <p class="text-xs uppercase tracking-wide text-slate-400">{{ typeMeta[item.type]?.label }}</p>
                        </div>
                        <span v-if="item.type === 'exam'" class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">Start →</span>
                        <span v-else class="text-slate-300">{{ selectedId === item.id ? '▾' : '▸' }}</span>
                    </button>

                    <!-- Step 3: the selected item's data, loaded from the single-content endpoint. -->
                    <div v-if="selectedId === item.id" class="border-t border-slate-100 px-5 py-4 text-sm text-slate-700">
                        <p v-if="contentLoading" class="text-slate-400">Loading lesson…</p>
                        <AlertMessage v-else-if="contentError" type="error" :message="contentError" />

                        <template v-else-if="selectedContent">
                            <p v-if="selectedContent.type === 'note'" class="whitespace-pre-line">{{ selectedContent.payload.body }}</p>

                            <div v-else-if="selectedContent.type === 'pdf'">
                                <iframe
                                    :src="selectedContent.payload.url"
                                    title="PDF document"
                                    class="h-[70vh] w-full rounded-lg border border-slate-200"
                                ></iframe>
                            </div>

                            <div v-else-if="selectedContent.type === 'video'">
                                <div v-if="embedUrl(selectedContent.payload.url)" class="aspect-video w-full">
                                    <iframe
                                        :src="embedUrl(selectedContent.payload.url)"
                                        title="Video player"
                                        class="h-full w-full rounded-lg border border-slate-200"
                                        frameborder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowfullscreen
                                    ></iframe>
                                </div>
                                <a
                                    v-else
                                    :href="selectedContent.payload.url"
                                    target="_blank"
                                    class="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500"
                                >Watch video<span v-if="selectedContent.payload.provider" class="text-slate-400"> ({{ selectedContent.payload.provider }})</span> →</a>
                            </div>

                            <div v-else-if="selectedContent.type === 'live'">
                                <p class="text-slate-500">Starts: {{ formatDate(selectedContent.payload.scheduled_at) }}</p>
                                <a :href="selectedContent.payload.url" target="_blank" class="mt-1 inline-flex font-medium text-rose-600 hover:text-rose-500">Join live →</a>
                            </div>

                            <a
                                v-else-if="selectedContent.type === 'link'"
                                :href="selectedContent.payload.url"
                                target="_blank"
                                class="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500"
                            >{{ selectedContent.payload.url }} →</a>

                            <div v-else-if="selectedContent.type === 'exam'">
                                <!-- Exam endpoints require a logged-in user (Bearer token). -->
                                <div v-if="!user" class="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-4 text-center">
                                    <p class="text-indigo-700">Please log in to take this exam.</p>
                                    <button
                                        class="mt-3 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                                        @click="emit('login')"
                                    >Log in to start</button>
                                </div>
                                <ExamPlayer
                                    v-else
                                    :key="selectedContent.id"
                                    :course-id="courseId"
                                    :content-id="selectedContent.id"
                                />
                            </div>
                        </template>
                    </div>
                </li>

                <li v-if="!course.contents.length" class="py-10 text-center text-slate-400">No lessons in this course yet.</li>
            </ul>
            </template>
        </div>
        </Transition>
    </div>
</template>
