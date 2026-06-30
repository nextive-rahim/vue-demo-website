<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';
import ExamPlayer from './ExamPlayer.vue';

const props = defineProps({
    courseId: { type: [Number, String], required: true },
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
    } catch (e) {
        error.value = 'Could not load this course.';
    } finally {
        loading.value = false;
    }
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
</script>

<template>
    <div class="mx-auto max-w-3xl p-6">
        <button class="mb-6 text-sm font-medium text-indigo-600 hover:text-indigo-500" @click="emit('back')">← All courses</button>

        <AlertMessage type="error" :message="error" class="mb-6" />
        <div v-if="loading" class="py-16 text-center text-slate-400">Loading…</div>

        <div v-else-if="course">
            <h1 class="text-3xl font-bold text-slate-900">{{ course.title }}</h1>
            <p class="mt-2 text-slate-600">{{ course.description }}</p>

            <!-- Step 2: list of content names. Click one to load its data (step 3). -->
            <ul class="mt-8 space-y-3">
                <li
                    v-for="item in course.contents"
                    :key="item.id"
                    class="overflow-hidden rounded-xl border bg-white"
                    :class="selectedId === item.id ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'"
                >
                    <button class="flex w-full items-center gap-3 p-5 text-left hover:bg-slate-50" @click="openContent(item)">
                        <span class="flex h-9 w-9 items-center justify-center rounded-lg text-lg" :class="typeMeta[item.type]?.color">
                            {{ typeMeta[item.type]?.icon }}
                        </span>
                        <div class="flex-1">
                            <p class="font-semibold text-slate-900">{{ item.title }}</p>
                            <p class="text-xs uppercase tracking-wide text-slate-400">{{ typeMeta[item.type]?.label }}</p>
                        </div>
                        <span class="text-slate-300">{{ selectedId === item.id ? '▾' : '▸' }}</span>
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
        </div>
    </div>
</template>
