<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';

const props = defineProps({
    noticeId: { type: [Number, String], required: true },
});

const emit = defineEmits(['back']);

const notice = ref(null);
const loading = ref(true);
const error = ref(null);

async function load() {
    loading.value = true;
    error.value = null;
    notice.value = null;
    try {
        notice.value = (await api.notice(props.noticeId)).data;
    } catch (e) {
        error.value = e?.status === 404 ? 'This notice is no longer available.' : 'Could not load this notice.';
    } finally {
        loading.value = false;
    }
}

/** Split the plain-text body into paragraphs for comfortable reading. */
const paragraphs = computed(() =>
    (notice.value?.body || '')
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
);

function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

onMounted(load);
watch(() => props.noticeId, load);
</script>

<template>
    <div class="relative overflow-hidden">
        <div class="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-200/60 to-violet-200/60 blur-3xl"></div>

        <div class="relative mx-auto max-w-3xl px-6 py-14">
            <button class="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="emit('back')">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                All notices
            </button>

            <AlertMessage type="error" :message="error" />

            <!-- Loading skeleton -->
            <div v-if="loading" class="animate-fade-in">
                <div class="skeleton h-5 w-32 rounded-full"></div>
                <div class="skeleton mt-6 h-10 w-11/12 rounded-xl"></div>
                <div class="skeleton mt-8 h-4 w-full rounded"></div>
                <div class="skeleton mt-3 h-4 w-full rounded"></div>
                <div class="skeleton mt-3 h-4 w-4/5 rounded"></div>
            </div>

            <!-- Article -->
            <article v-else-if="notice" class="animate-fade-up">
                <div class="flex flex-wrap items-center gap-3 text-sm">
                    <span class="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-100">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v4M14 2v4" stroke-linecap="round" /><rect x="4" y="6" width="16" height="16" rx="2" /><path d="M4 11h16" /></svg>
                        Notice
                    </span>
                    <span class="text-slate-400">{{ formatDate(notice.published_at || notice.created_at) }}</span>
                </div>

                <h1 class="mt-6 text-3xl font-black leading-tight tracking-tight text-slate-900 lg:text-4xl">{{ notice.title }}</h1>

                <div v-if="notice.image_url" class="mt-8 overflow-hidden rounded-3xl shadow-xl shadow-slate-200/60 ring-1 ring-slate-100">
                    <img :src="notice.image_url" :alt="notice.title" class="max-h-[26rem] w-full object-cover" />
                </div>

                <div class="mt-8 h-px w-full bg-gradient-to-r from-indigo-200 via-slate-200 to-transparent"></div>

                <div class="mt-8 space-y-5 text-[17px] leading-relaxed text-slate-600">
                    <p v-for="(para, i) in paragraphs" :key="i" class="whitespace-pre-line">{{ para }}</p>
                    <p v-if="!paragraphs.length" class="italic text-slate-400">No further details.</p>
                </div>

                <!-- Footer callout -->
                <div class="mt-12 flex items-center justify-between rounded-2xl bg-slate-50 px-6 py-5 ring-1 ring-slate-100">
                    <div>
                        <p class="text-sm font-semibold text-slate-900">Looking for more?</p>
                        <p class="text-sm text-slate-500">Browse all announcements on the notice board.</p>
                    </div>
                    <button class="shrink-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-95" @click="emit('back')">
                        View all
                    </button>
                </div>
            </article>
        </div>
    </div>
</template>
