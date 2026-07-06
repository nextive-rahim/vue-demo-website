<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';

const emit = defineEmits(['open', 'back']);

const courses = ref([]);
const loading = ref(true);
const error = ref(null);
const search = ref('');

async function load() {
    loading.value = true;
    error.value = null;
    try {
        courses.value = (await api.courses()).data;
    } catch (e) {
        error.value = 'Could not load courses.';
    } finally {
        loading.value = false;
    }
}

const filtered = computed(() => {
    const term = search.value.trim().toLowerCase();
    if (!term) return courses.value;
    return courses.value.filter(
        (c) => c.title.toLowerCase().includes(term) || (c.description || '').toLowerCase().includes(term),
    );
});

const gradients = [
    'from-indigo-500 to-violet-600',
    'from-violet-500 to-fuchsia-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
];

onMounted(load);
</script>

<template>
    <div class="relative overflow-hidden">
        <div class="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-200/60 to-violet-200/60 blur-3xl"></div>
        <div class="pointer-events-none absolute -right-40 top-40 h-80 w-80 rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 blur-3xl"></div>

        <div class="relative mx-auto max-w-7xl px-5 py-14 sm:px-6">
            <!-- Header -->
            <div class="animate-fade-up">
                <button class="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="emit('back')">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    Home
                </button>

                <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <span class="text-sm font-bold uppercase tracking-widest text-indigo-500">Catalog</span>
                        <h1 class="mt-2 text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">
                            Explore <span class="text-gradient">courses</span>
                        </h1>
                        <p class="mt-3 max-w-lg text-lg text-slate-500">Pick a course and start learning with notes, videos, live classes and exams.</p>
                    </div>

                    <div class="relative w-full sm:w-72">
                        <svg class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" stroke-linecap="round" /></svg>
                        <input
                            v-model="search"
                            type="search"
                            placeholder="Search courses…"
                            class="w-full rounded-full border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none backdrop-blur transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />
                    </div>
                </div>
            </div>

            <AlertMessage type="error" :message="error" class="mt-8" />

            <!-- Loading -->
            <div v-if="loading" class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="i in 6" :key="i" class="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                    <div class="skeleton h-36 w-full"></div>
                    <div class="p-6">
                        <div class="skeleton h-5 w-2/3 rounded"></div>
                        <div class="skeleton mt-3 h-4 w-full rounded"></div>
                        <div class="skeleton mt-2 h-4 w-4/5 rounded"></div>
                    </div>
                </div>
            </div>

            <!-- Grid -->
            <div v-else class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <button
                    v-for="(course, i) in filtered"
                    :key="course.id"
                    class="group animate-fade-up overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10"
                    :style="{ animationDelay: `${Math.min(i, 9) * 60}ms` }"
                    @click="emit('open', course.id)"
                >
                    <div :class="`relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br ${gradients[i % gradients.length]} text-6xl font-black text-white/90`">
                        <span class="transition duration-500 group-hover:scale-125">{{ course.title.charAt(0) }}</span>
                        <span class="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/30 backdrop-blur">{{ course.contents_count }} lessons</span>
                    </div>
                    <div class="p-6">
                        <h2 class="font-bold text-slate-900 transition group-hover:text-indigo-600">{{ course.title }}</h2>
                        <p class="mt-2 line-clamp-2 text-sm text-slate-500">{{ course.description }}</p>
                        <span class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                            Explore course
                            <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                        </span>
                    </div>
                </button>

                <div v-if="!filtered.length" class="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 py-20 text-center">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-3xl">🔍</div>
                    <p class="mt-5 text-lg font-semibold text-slate-700">{{ search ? 'No courses match your search' : 'No courses available yet' }}</p>
                    <p class="mt-1 text-sm text-slate-400">{{ search ? 'Try a different keyword.' : 'Check back soon.' }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
