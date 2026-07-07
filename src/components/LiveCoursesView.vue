<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';

const emit = defineEmits(['back', 'open', 'open-exam']);

const exams = ref([]);
const classes = ref([]);
const loading = ref(true);
const error = ref(null);
const activeTab = ref('exam'); // exam | class

async function load() {
    loading.value = true;
    error.value = null;
    try {
        const data = await api.todaysLive();
        exams.value = data.exams || [];
        classes.value = data.classes || [];
    } catch (e) {
        error.value = "Could not load today's live schedule.";
    } finally {
        loading.value = false;
    }
}

const items = computed(() => (activeTab.value === 'exam' ? exams.value : classes.value));

function time(value) {
    if (!value) return 'TBA';
    return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function isSoon(value) {
    if (!value) return false;
    const diff = new Date(value).getTime() - Date.now();
    return diff > 0 && diff < 3 * 3600 * 1000;
}

function join(item) {
    if (item.url) window.open(item.url, '_blank', 'noopener');
}

const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

onMounted(load);
</script>

<template>
    <div class="relative overflow-hidden">
        <div class="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-rose-200/50 to-indigo-200/50 blur-3xl"></div>

        <div class="relative mx-auto max-w-5xl px-5 py-14 sm:px-6">
            <div class="animate-fade-up">
                <button class="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="emit('back')">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    Home
                </button>
                <span class="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-rose-500">
                    <span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span><span class="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span></span>
                    {{ todayLabel }}
                </span>
                <h1 class="mt-2 text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">Today's <span class="text-gradient">Live</span></h1>
                <p class="mt-3 max-w-lg text-lg text-slate-500">Exams and live classes scheduled for today, pulled straight from your courses.</p>

                <!-- Sub-tabs -->
                <div class="mt-6 inline-flex gap-1.5 rounded-full bg-slate-100 p-1.5">
                    <button class="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition" :class="activeTab === 'exam' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'" @click="activeTab = 'exam'">
                        🎯 Today's Exam
                        <span class="rounded-full px-1.5 text-xs" :class="activeTab === 'exam' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'">{{ exams.length }}</span>
                    </button>
                    <button class="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition" :class="activeTab === 'class' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'" @click="activeTab = 'class'">
                        🔴 Today's Class
                        <span class="rounded-full px-1.5 text-xs" :class="activeTab === 'class' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'">{{ classes.length }}</span>
                    </button>
                </div>
            </div>

            <AlertMessage type="error" :message="error" class="mt-8" />

            <div v-if="loading" class="mt-10 space-y-4">
                <div v-for="i in 3" :key="i" class="skeleton h-24 w-full rounded-2xl"></div>
            </div>

            <div v-else class="mt-10 space-y-4">
                <div
                    v-for="(item, i) in items"
                    :key="item.id"
                    v-reveal="{ delay: i * 70 }"
                    class="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-lg sm:flex-row sm:items-center"
                >
                    <!-- Time badge -->
                    <div class="flex shrink-0 flex-col items-center justify-center rounded-2xl px-5 py-3 text-center text-white sm:w-28" :class="activeTab === 'exam' ? 'bg-gradient-to-br from-indigo-500 to-violet-600' : 'bg-gradient-to-br from-rose-500 to-red-600'">
                        <span class="text-[10px] font-semibold uppercase tracking-wider opacity-90">{{ activeTab === 'exam' ? 'Exam' : 'Live' }}</span>
                        <span class="text-lg font-black">{{ time(item.start_at) }}</span>
                    </div>

                    <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                            <span v-if="isSoon(item.start_at)" class="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-600">Starting soon</span>
                            <h3 class="truncate font-bold text-slate-900">{{ item.title }}</h3>
                        </div>
                        <p class="mt-1 text-sm text-slate-500">📚 {{ item.course_title }}</p>
                        <p v-if="activeTab === 'exam' && item.duration_minutes" class="mt-1 text-xs font-medium text-slate-400">⏱ {{ item.duration_minutes }} min</p>
                    </div>

                    <!-- Actions -->
                    <button
                        v-if="activeTab === 'exam'"
                        class="shrink-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"
                        @click="emit('open-exam', { courseId: item.course_id, contentId: item.id })"
                    >
                        Go to exam
                    </button>
                    <button
                        v-else
                        class="shrink-0 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:-translate-y-0.5 disabled:opacity-50"
                        :disabled="!item.url"
                        @click="item.url ? join(item) : emit('open', item.course_id)"
                    >
                        {{ item.url ? 'Join Live' : 'View' }}
                    </button>
                </div>

                <!-- Empty state -->
                <div v-if="!items.length" class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 py-20 text-center">
                    <div class="text-3xl">{{ activeTab === 'exam' ? '🎯' : '🔴' }}</div>
                    <p class="mt-4 text-lg font-semibold text-slate-700">No {{ activeTab === 'exam' ? 'exams' : 'live classes' }} today</p>
                    <p class="mt-1 text-sm text-slate-400">Check back tomorrow, or browse all courses.</p>
                </div>
            </div>
        </div>
    </div>
</template>
