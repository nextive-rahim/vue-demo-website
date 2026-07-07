<script setup>
import { onMounted, ref, watch } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';
import ExamPlayer from './ExamPlayer.vue';

const props = defineProps({
    courseId: { type: [Number, String], required: true },
    initialExamId: { type: [Number, String], default: null },
    user: { type: Object, default: null },
});

const emit = defineEmits(['back', 'login']);

const course = ref(null);
const loading = ref(true);
const error = ref(null);

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
const examItem = ref(null);

function openExam(item) {
    examItem.value = item;
    window.scrollTo({ top: 0, behavior: 'auto' });
}

function closeExam() {
    examItem.value = null;
}

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
    <div class="relative mx-auto max-w-3xl px-5 py-14 sm:px-6">
        <div class="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-200/50 to-violet-200/50 blur-3xl"></div>

        <button class="relative mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="emit('back')">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
            All courses
        </button>

        <AlertMessage type="error" :message="error" class="relative mb-6" />
        <div v-if="loading" class="relative py-16 text-center text-slate-400">Loading…</div>

        <div v-else-if="course" class="animate-fade-up relative">
            <!-- Exam full page: detail → take → analysis -->
            <div v-if="examItem">
                <button class="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="closeExam">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    Back to course
                </button>
                <div v-if="!user" class="rounded-3xl border border-indigo-100 bg-indigo-50 px-6 py-12 text-center">
                    <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">🔒</div>
                    <p class="mt-4 text-lg font-bold text-slate-900">Log in to take this exam</p>
                    <p class="mt-1 text-sm text-slate-500">You need an account to start the exam and see your analysis.</p>
                    <button class="mt-5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5" @click="emit('login')">Log in to start</button>
                </div>
                <ExamPlayer v-else :key="examItem.id" :course-id="courseId" :content-id="examItem.id" />
            </div>

            <template v-else>
            <span class="text-sm font-bold uppercase tracking-widest text-indigo-500">Course</span>
            <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-900 lg:text-4xl">{{ course.title }}</h1>
            <p class="mt-3 text-lg text-slate-500">{{ course.description }}</p>
            <p class="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-100">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V6a2 2 0 012-2h9l5 5v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" stroke-linejoin="round" /></svg>
                {{ course.contents.length }} lessons
            </p>

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
    </div>
</template>
