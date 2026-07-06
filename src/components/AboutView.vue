<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';

const emit = defineEmits(['back', 'browse']);

const about = ref(null);
const loading = ref(true);
const error = ref(null);

async function load() {
    loading.value = true;
    error.value = null;
    try {
        about.value = (await api.about()).data;
    } catch (e) {
        error.value = 'Could not load the About page.';
    } finally {
        loading.value = false;
    }
}

const paragraphs = computed(() =>
    (about.value?.body || '')
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
);

const stats = [
    { value: '12k+', label: 'Students' },
    { value: '250+', label: 'Lessons' },
    { value: '98%', label: 'Success rate' },
    { value: '4.9', label: 'Rating' },
];

onMounted(load);
</script>

<template>
    <div class="relative overflow-hidden">
        <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div class="animate-blob absolute -left-24 top-20 h-80 w-80 bg-gradient-to-br from-indigo-300/40 to-blue-300/40 blur-3xl"></div>
            <div class="animate-blob absolute -right-16 top-10 h-96 w-96 bg-gradient-to-br from-violet-300/40 to-fuchsia-300/40 blur-3xl" style="animation-delay: -6s"></div>
        </div>

        <div class="relative mx-auto max-w-5xl px-5 py-14 sm:px-6">
            <button class="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="emit('back')">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                Home
            </button>

            <AlertMessage type="error" :message="error" />

            <div v-if="loading" class="animate-fade-in">
                <div class="skeleton h-6 w-40 rounded-full"></div>
                <div class="skeleton mt-5 h-12 w-3/4 rounded-xl"></div>
                <div class="skeleton mt-8 h-72 w-full rounded-3xl"></div>
            </div>

            <template v-else-if="about">
                <!-- Hero -->
                <div class="animate-fade-up text-center">
                    <span class="text-sm font-bold uppercase tracking-widest text-indigo-500">Who we are</span>
                    <h1 class="mt-3 text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">{{ about.heading }}</h1>
                    <p v-if="about.subheading" class="mx-auto mt-4 max-w-2xl text-lg text-slate-500">{{ about.subheading }}</p>
                </div>

                <!-- Image -->
                <div v-if="about.image_url" v-reveal class="mt-10 overflow-hidden rounded-3xl shadow-2xl shadow-slate-200/70 ring-1 ring-slate-100">
                    <img :src="about.image_url" :alt="about.heading" class="max-h-[28rem] w-full object-cover" />
                </div>

                <!-- Body -->
                <div v-if="paragraphs.length" v-reveal class="mx-auto mt-12 max-w-3xl space-y-5 text-[17px] leading-relaxed text-slate-600">
                    <p v-for="(para, i) in paragraphs" :key="i" class="whitespace-pre-line">{{ para }}</p>
                </div>

                <!-- Mission / Vision -->
                <div class="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div v-if="about.mission" v-reveal class="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
                        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-2xl shadow-lg">🎯</div>
                        <h3 class="mt-5 text-xl font-bold text-slate-900">Our mission</h3>
                        <p class="mt-2 leading-relaxed text-slate-500">{{ about.mission }}</p>
                    </div>
                    <div v-if="about.vision" v-reveal="{ delay: 90 }" class="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
                        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl shadow-lg">🚀</div>
                        <h3 class="mt-5 text-xl font-bold text-slate-900">Our vision</h3>
                        <p class="mt-2 leading-relaxed text-slate-500">{{ about.vision }}</p>
                    </div>
                </div>

                <!-- Stats -->
                <div v-reveal class="relative mt-14 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-12 shadow-2xl shadow-indigo-500/30 sm:px-12">
                    <div class="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"></div>
                    <div class="relative grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
                        <div v-for="s in stats" :key="s.label">
                            <p class="text-4xl font-black text-white sm:text-5xl">{{ s.value }}</p>
                            <p class="mt-2 text-sm font-medium text-indigo-100">{{ s.label }}</p>
                        </div>
                    </div>
                </div>

                <!-- CTA -->
                <div v-reveal class="mt-12 text-center">
                    <button class="rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5" @click="emit('browse')">
                        Explore our courses
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>
