<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api';

const emit = defineEmits(['open', 'browse', 'login']);

const courses = ref([]);
const loading = ref(true);

async function load() {
    try {
        courses.value = ((await api.courses()).data || []).slice(0, 3);
    } catch {
        courses.value = [];
    } finally {
        loading.value = false;
    }
}

onMounted(load);
</script>

<template>
    <div>
        <!-- Hero -->
        <section class="relative overflow-hidden">
            <div class="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-200 to-violet-200 blur-3xl"></div>
            <div class="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
                <div class="max-w-2xl">
                    <span class="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-600">
                        🚀 Learn at your own pace
                    </span>
                    <h1 class="mt-6 text-5xl font-black leading-tight tracking-tight text-slate-900 lg:text-6xl">
                        Learn anything.<br />
                        <span class="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">It's possible.</span>
                    </h1>
                    <p class="mt-6 max-w-xl text-lg text-slate-500">
                        Notes, PDFs, videos, live classes and exams — all in one place. Join Demo Website
                        and start building skills that matter.
                    </p>
                    <div class="mt-8 flex flex-wrap gap-4">
                        <button
                            class="rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-95"
                            @click="emit('browse')"
                        >
                            Browse courses
                        </button>
                        <button
                            class="rounded-full bg-white px-7 py-3.5 font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:ring-slate-300"
                            @click="emit('login')"
                        >
                            Get started
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Featured courses -->
        <section class="mx-auto max-w-7xl px-6 pb-24">
            <div class="mb-8 flex items-end justify-between">
                <div>
                    <h2 class="text-3xl font-bold text-slate-900">Popular courses</h2>
                    <p class="mt-1 text-slate-500">Hand-picked to get you started.</p>
                </div>
                <button class="text-sm font-semibold text-indigo-600 hover:text-indigo-500" @click="emit('browse')">View all →</button>
            </div>

            <div v-if="loading" class="py-16 text-center text-slate-400">Loading…</div>

            <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <button
                    v-for="course in courses"
                    :key="course.id"
                    class="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:shadow-xl"
                    @click="emit('open', course.id)"
                >
                    <div class="flex h-32 items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-5xl font-black text-white/90">
                        {{ course.title.charAt(0) }}
                    </div>
                    <div class="p-6">
                        <h3 class="font-semibold text-slate-900 group-hover:text-indigo-600">{{ course.title }}</h3>
                        <p class="mt-1 line-clamp-2 text-sm text-slate-500">{{ course.description }}</p>
                        <p class="mt-4 text-xs font-medium text-slate-400">{{ course.contents_count }} lessons</p>
                    </div>
                </button>

                <p v-if="!courses.length" class="col-span-full py-16 text-center text-slate-400">No courses available yet.</p>
            </div>
        </section>
    </div>
</template>
