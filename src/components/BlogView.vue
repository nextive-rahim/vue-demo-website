<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';

const emit = defineEmits(['open', 'back']);

const posts = ref([]);
const loading = ref(true);
const error = ref(null);
const filter = ref('all'); // all | blog | news

const tabs = [
    { key: 'all', label: 'All' },
    { key: 'news', label: 'News' },
    { key: 'blog', label: 'Blog' },
];

async function load() {
    loading.value = true;
    error.value = null;
    try {
        posts.value = (await api.posts()).data;
    } catch (e) {
        error.value = 'Could not load blog and news.';
    } finally {
        loading.value = false;
    }
}

const shown = computed(() => (filter.value === 'all' ? posts.value : posts.value.filter((p) => p.type === filter.value)));
const featured = computed(() => (filter.value === 'all' ? shown.value[0] ?? null : null));
const rest = computed(() => (featured.value ? shown.value.slice(1) : shown.value));

function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function excerptOf(post, length = 140) {
    const text = post.excerpt || post.body || '';
    const clean = text.replace(/\s+/g, ' ').trim();
    return clean.length > length ? `${clean.slice(0, length)}…` : clean;
}

const typeBadge = { blog: 'bg-indigo-50 text-indigo-600', news: 'bg-amber-50 text-amber-600' };

onMounted(load);
</script>

<template>
    <div class="relative overflow-hidden">
        <div class="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-200/60 to-violet-200/60 blur-3xl"></div>

        <div class="relative mx-auto max-w-7xl px-5 py-14 sm:px-6">
            <!-- Header -->
            <div class="animate-fade-up">
                <button class="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="emit('back')">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    Home
                </button>

                <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <span class="text-sm font-bold uppercase tracking-widest text-indigo-500">Stay informed</span>
                        <h1 class="mt-2 text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">Blog &amp; <span class="text-gradient">News</span></h1>
                        <p class="mt-3 max-w-lg text-lg text-slate-500">Latest articles, updates and announcements from Demo Website.</p>
                    </div>
                    <div class="flex gap-1 self-start rounded-full bg-slate-100 p-1">
                        <button v-for="t in tabs" :key="t.key" class="rounded-full px-4 py-2 text-sm font-semibold transition" :class="filter === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'" @click="filter = t.key">{{ t.label }}</button>
                    </div>
                </div>
            </div>

            <AlertMessage type="error" :message="error" class="mt-8" />

            <!-- Loading -->
            <div v-if="loading" class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="i in 6" :key="i" class="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                    <div class="skeleton h-44 w-full"></div>
                    <div class="p-6">
                        <div class="skeleton h-5 w-3/4 rounded"></div>
                        <div class="skeleton mt-3 h-4 w-full rounded"></div>
                    </div>
                </div>
            </div>

            <template v-else>
                <!-- Featured -->
                <button
                    v-if="featured"
                    class="group animate-fade-up mt-10 grid w-full gap-0 overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 lg:grid-cols-2"
                    @click="emit('open', featured.id)"
                >
                    <div class="relative h-56 overflow-hidden lg:h-full">
                        <img v-if="featured.image_url" :src="featured.image_url" alt="" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-7xl font-black text-white/90">{{ featured.title.charAt(0) }}</div>
                    </div>
                    <div class="flex flex-col justify-center p-8">
                        <div class="flex items-center gap-3">
                            <span class="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase" :class="typeBadge[featured.type]">{{ featured.type }}</span>
                            <span class="text-sm text-slate-400">{{ formatDate(featured.published_at || featured.created_at) }}</span>
                        </div>
                        <h2 class="mt-4 text-2xl font-bold text-slate-900 transition group-hover:text-indigo-600 lg:text-3xl">{{ featured.title }}</h2>
                        <p class="mt-3 text-slate-500">{{ excerptOf(featured, 200) }}</p>
                        <span class="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                            Read article
                            <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                        </span>
                    </div>
                </button>

                <!-- Grid -->
                <div v-if="rest.length" class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <button
                        v-for="(post, i) in rest"
                        :key="post.id"
                        class="group animate-fade-up overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10"
                        :style="{ animationDelay: `${Math.min(i, 9) * 60}ms` }"
                        @click="emit('open', post.id)"
                    >
                        <div class="relative h-44 overflow-hidden">
                            <img v-if="post.image_url" :src="post.image_url" alt="" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                            <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-5xl font-black text-white/90">{{ post.title.charAt(0) }}</div>
                            <span class="absolute left-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase shadow-sm backdrop-blur" :class="typeBadge[post.type]">{{ post.type }}</span>
                        </div>
                        <div class="p-6">
                            <p class="text-xs text-slate-400">{{ formatDate(post.published_at || post.created_at) }}</p>
                            <h3 class="mt-1.5 font-bold text-slate-900 transition group-hover:text-indigo-600">{{ post.title }}</h3>
                            <p class="mt-2 line-clamp-2 text-sm text-slate-500">{{ excerptOf(post) }}</p>
                        </div>
                    </button>
                </div>

                <div v-if="!featured && !rest.length" class="mt-16 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 py-20 text-center">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-3xl">📰</div>
                    <p class="mt-5 text-lg font-semibold text-slate-700">Nothing here yet</p>
                    <p class="mt-1 text-sm text-slate-400">Check back soon for new articles.</p>
                </div>
            </template>
        </div>
    </div>
</template>
