<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';

const props = defineProps({
    postId: { type: [Number, String], required: true },
});

const emit = defineEmits(['back']);

const post = ref(null);
const loading = ref(true);
const error = ref(null);

async function load() {
    loading.value = true;
    error.value = null;
    post.value = null;
    try {
        post.value = (await api.post(props.postId)).data;
    } catch (e) {
        error.value = e?.status === 404 ? 'This article is no longer available.' : 'Could not load this article.';
    } finally {
        loading.value = false;
    }
}

const paragraphs = computed(() =>
    (post.value?.body || '')
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
);

function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

const typeBadge = { blog: 'bg-indigo-50 text-indigo-600', news: 'bg-amber-50 text-amber-600' };

onMounted(load);
watch(() => props.postId, load);
</script>

<template>
    <div class="relative overflow-hidden">
        <div class="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-200/60 to-violet-200/60 blur-3xl"></div>

        <div class="relative mx-auto max-w-3xl px-5 py-14 sm:px-6">
            <button class="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="emit('back')">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                Blog &amp; News
            </button>

            <AlertMessage type="error" :message="error" />

            <div v-if="loading" class="animate-fade-in">
                <div class="skeleton h-5 w-32 rounded-full"></div>
                <div class="skeleton mt-6 h-10 w-11/12 rounded-xl"></div>
                <div class="skeleton mt-8 h-64 w-full rounded-3xl"></div>
            </div>

            <article v-else-if="post" class="animate-fade-up">
                <div class="flex flex-wrap items-center gap-3 text-sm">
                    <span class="rounded-full px-3 py-1 text-xs font-bold uppercase" :class="typeBadge[post.type]">{{ post.type }}</span>
                    <span class="text-slate-400">{{ formatDate(post.published_at || post.created_at) }}</span>
                </div>

                <h1 class="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-900 lg:text-4xl">{{ post.title }}</h1>
                <p v-if="post.excerpt" class="mt-4 text-lg text-slate-500">{{ post.excerpt }}</p>

                <div v-if="post.image_url" class="mt-8 overflow-hidden rounded-3xl shadow-xl shadow-slate-200/60 ring-1 ring-slate-100">
                    <img :src="post.image_url" :alt="post.title" class="max-h-[26rem] w-full object-cover" />
                </div>

                <div class="mt-8 h-px w-full bg-gradient-to-r from-indigo-200 via-slate-200 to-transparent"></div>

                <div class="mt-8 space-y-5 text-[17px] leading-relaxed text-slate-600">
                    <p v-for="(para, i) in paragraphs" :key="i" class="whitespace-pre-line">{{ para }}</p>
                </div>

                <div class="mt-12 flex items-center justify-between rounded-2xl bg-slate-50 px-6 py-5 ring-1 ring-slate-100">
                    <p class="text-sm font-semibold text-slate-900">Read more articles</p>
                    <button class="shrink-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-95" @click="emit('back')">Back to Blog &amp; News</button>
                </div>
            </article>
        </div>
    </div>
</template>
