<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';

const emit = defineEmits(['back']);

const lives = ref([]);
const loading = ref(true);
const error = ref(null);

async function load() {
    loading.value = true;
    error.value = null;
    try {
        lives.value = (await api.liveCourses()).data;
    } catch (e) {
        error.value = 'Could not load live courses.';
    } finally {
        loading.value = false;
    }
}

function join(live) {
    if (live.join_url) window.open(live.join_url, '_blank', 'noopener');
}

function when(value) {
    if (!value) return { date: 'TBA', time: '' };
    const d = new Date(value);
    return {
        date: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
        time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    };
}

function isSoon(value) {
    if (!value) return false;
    const diff = new Date(value).getTime() - Date.now();
    return diff > 0 && diff < 3 * 3600 * 1000;
}

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
                    Live now
                </span>
                <h1 class="mt-2 text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">Live <span class="text-gradient">classes</span></h1>
                <p class="mt-3 max-w-lg text-lg text-slate-500">Join scheduled live classes with expert instructors — in real time.</p>
            </div>

            <AlertMessage type="error" :message="error" class="mt-8" />

            <div v-if="loading" class="mt-10 space-y-4">
                <div v-for="i in 4" :key="i" class="skeleton h-28 w-full rounded-2xl"></div>
            </div>

            <div v-else class="mt-10 space-y-4">
                <div
                    v-for="(live, i) in lives"
                    :key="live.id"
                    v-reveal="{ delay: i * 70 }"
                    class="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-lg sm:flex-row sm:items-center"
                >
                    <!-- Date badge -->
                    <div class="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-3 text-center text-white sm:w-28">
                        <span class="text-sm font-semibold">{{ when(live.scheduled_at).date }}</span>
                        <span class="text-lg font-black">{{ when(live.scheduled_at).time }}</span>
                    </div>

                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                            <span v-if="isSoon(live.scheduled_at)" class="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-600">Starting soon</span>
                            <h3 class="truncate font-bold text-slate-900">{{ live.title }}</h3>
                        </div>
                        <p v-if="live.description" class="mt-1 line-clamp-1 text-sm text-slate-500">{{ live.description }}</p>
                        <p v-if="live.instructor_name" class="mt-1.5 text-xs font-medium text-slate-400">👤 {{ live.instructor_name }}</p>
                    </div>

                    <button
                        class="shrink-0 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:-translate-y-0.5 disabled:opacity-50"
                        :disabled="!live.join_url"
                        @click="join(live)"
                    >
                        {{ live.join_url ? 'Join Live' : 'Soon' }}
                    </button>
                </div>

                <div v-if="!lives.length" class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 py-20 text-center">
                    <div class="text-3xl">🔴</div><p class="mt-4 text-lg font-semibold text-slate-700">No live classes scheduled</p>
                    <p class="mt-1 text-sm text-slate-400">Check back soon.</p>
                </div>
            </div>
        </div>
    </div>
</template>
