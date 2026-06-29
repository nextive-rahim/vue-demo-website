<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';

const emit = defineEmits(['open', 'back']);

const courses = ref([]);
const loading = ref(true);
const error = ref(null);

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

onMounted(load);
</script>

<template>
    <div class="mx-auto max-w-5xl p-6">
        <div class="mb-6 flex items-center justify-between">
            <h1 class="text-2xl font-bold text-slate-900">Courses</h1>
            <button class="text-sm font-medium text-indigo-600 hover:text-indigo-500" @click="emit('back')">← Home</button>
        </div>

        <AlertMessage type="error" :message="error" class="mb-6" />

        <div v-if="loading" class="py-16 text-center text-slate-400">Loading…</div>

        <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <button
                v-for="course in courses"
                :key="course.id"
                class="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md"
                @click="emit('open', course.id)"
            >
                <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 font-bold">
                    {{ course.title.charAt(0) }}
                </div>
                <h2 class="font-semibold text-slate-900">{{ course.title }}</h2>
                <p class="mt-1 line-clamp-2 text-sm text-slate-500">{{ course.description }}</p>
                <p class="mt-4 text-xs font-medium text-slate-400">{{ course.contents_count }} lessons</p>
            </button>

            <p v-if="!courses.length" class="col-span-full py-16 text-center text-slate-400">No courses available yet.</p>
        </div>
    </div>
</template>
