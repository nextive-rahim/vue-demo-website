<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';

const props = defineProps({
    courseId: { type: [Number, String], required: true },
});

const emit = defineEmits(['back']);

const course = ref(null);
const loading = ref(true);
const error = ref(null);

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

            <ul class="mt-8 space-y-3">
                <li
                    v-for="item in course.contents"
                    :key="item.id"
                    class="rounded-xl border border-slate-200 bg-white p-5"
                >
                    <div class="flex items-center gap-3">
                        <span class="flex h-9 w-9 items-center justify-center rounded-lg text-lg" :class="typeMeta[item.type]?.color">
                            {{ typeMeta[item.type]?.icon }}
                        </span>
                        <div>
                            <p class="font-semibold text-slate-900">{{ item.title }}</p>
                            <p class="text-xs uppercase tracking-wide text-slate-400">{{ typeMeta[item.type]?.label }}</p>
                        </div>
                    </div>

                    <!-- Type-specific rendering -->
                    <div class="mt-3 text-sm text-slate-700">
                        <p v-if="item.type === 'note'" class="whitespace-pre-line">{{ item.payload.body }}</p>

                        <a
                            v-else-if="item.type === 'pdf'"
                            :href="item.payload.url"
                            target="_blank"
                            class="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500"
                        >Open PDF →</a>

                        <a
                            v-else-if="item.type === 'video'"
                            :href="item.payload.url"
                            target="_blank"
                            class="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500"
                        >Watch video<span v-if="item.payload.provider" class="text-slate-400"> ({{ item.payload.provider }})</span> →</a>

                        <div v-else-if="item.type === 'live'">
                            <p class="text-slate-500">Starts: {{ formatDate(item.payload.scheduled_at) }}</p>
                            <a :href="item.payload.url" target="_blank" class="mt-1 inline-flex font-medium text-rose-600 hover:text-rose-500">Join live →</a>
                        </div>

                        <a
                            v-else-if="item.type === 'link'"
                            :href="item.payload.url"
                            target="_blank"
                            class="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500"
                        >{{ item.payload.url }} →</a>

                        <div v-else-if="item.type === 'exam'" class="flex flex-wrap items-center gap-4">
                            <span v-if="item.payload.duration_minutes" class="text-slate-500">⏱ {{ item.payload.duration_minutes }} min</span>
                            <span v-if="item.payload.total_marks" class="text-slate-500">🏆 {{ item.payload.total_marks }} marks</span>
                            <a v-if="item.payload.url" :href="item.payload.url" target="_blank" class="font-medium text-purple-600 hover:text-purple-500">Start exam →</a>
                        </div>
                    </div>
                </li>

                <li v-if="!course.contents.length" class="py-10 text-center text-slate-400">No lessons in this course yet.</li>
            </ul>
        </div>
    </div>
</template>
