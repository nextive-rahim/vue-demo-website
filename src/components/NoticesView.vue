<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';

const emit = defineEmits(['open', 'back']);

const notices = ref([]);
const loading = ref(true);
const error = ref(null);
const search = ref('');

async function load() {
    loading.value = true;
    error.value = null;
    try {
        notices.value = (await api.notices()).data;
    } catch (e) {
        error.value = 'Could not load notices right now. Please try again shortly.';
    } finally {
        loading.value = false;
    }
}

const filtered = computed(() => {
    const term = search.value.trim().toLowerCase();
    if (!term) return notices.value;
    return notices.value.filter(
        (n) => n.title.toLowerCase().includes(term) || (n.body || '').toLowerCase().includes(term),
    );
});

/** The newest notice gets a hero "featured" treatment. */
const featured = computed(() => (search.value ? null : filtered.value[0] ?? null));
const rest = computed(() => (featured.value ? filtered.value.slice(1) : filtered.value));

function isFresh(notice) {
    const date = notice.published_at || notice.created_at;
    if (!date) return false;
    const days = (Date.now() - new Date(date).getTime()) / 86_400_000;
    return days <= 4;
}

function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function excerpt(body, length = 160) {
    if (!body) return '';
    const clean = body.replace(/\s+/g, ' ').trim();
    return clean.length > length ? `${clean.slice(0, length)}…` : clean;
}

onMounted(load);
</script>

<template>
    <div class="relative overflow-hidden">
        <!-- Ambient gradient blobs -->
        <div class="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-200/70 to-violet-200/70 blur-3xl"></div>
        <div class="pointer-events-none absolute -right-40 top-40 h-80 w-80 rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 blur-3xl"></div>

        <div class="relative mx-auto max-w-6xl px-6 py-14">
            <!-- Header -->
            <div class="animate-fade-up">
                <button class="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="emit('back')">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    Home
                </button>

                <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <span class="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-100">
                            <span class="relative flex h-2 w-2">
                                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                                <span class="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                            </span>
                            Announcements
                        </span>
                        <h1 class="mt-4 text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">
                            Notice <span class="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">Board</span>
                        </h1>
                        <p class="mt-3 max-w-lg text-lg text-slate-500">
                            Stay in the loop — the latest updates, schedules and announcements from Demo Website.
                        </p>
                    </div>

                    <!-- Search -->
                    <div class="relative w-full sm:w-72">
                        <svg class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" stroke-linecap="round" /></svg>
                        <input
                            v-model="search"
                            type="search"
                            placeholder="Search notices…"
                            class="w-full rounded-full border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none backdrop-blur transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />
                    </div>
                </div>
            </div>

            <AlertMessage type="error" :message="error" class="mt-8" />

            <!-- Loading skeletons -->
            <div v-if="loading" class="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div v-for="i in 4" :key="i" class="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm">
                    <div class="skeleton h-5 w-24 rounded-full"></div>
                    <div class="skeleton mt-4 h-6 w-3/4 rounded-lg"></div>
                    <div class="skeleton mt-3 h-4 w-full rounded"></div>
                    <div class="skeleton mt-2 h-4 w-5/6 rounded"></div>
                </div>
            </div>

            <template v-else>
                <!-- Featured latest notice -->
                <button
                    v-if="featured"
                    class="group animate-fade-up mt-10 block w-full overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-left shadow-xl shadow-indigo-500/25 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/40 lg:p-10"
                    @click="emit('open', featured.id)"
                >
                    <div class="flex flex-col gap-7 lg:flex-row lg:items-center">
                        <div class="flex-1">
                            <div class="flex items-center gap-3">
                                <span class="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ring-1 ring-inset ring-white/30">Latest</span>
                                <span class="text-sm font-medium text-indigo-100">{{ formatDate(featured.published_at || featured.created_at) }}</span>
                            </div>
                            <h2 class="mt-5 text-2xl font-bold text-white lg:text-3xl">{{ featured.title }}</h2>
                            <p class="mt-3 max-w-2xl text-indigo-100">{{ excerpt(featured.body, 220) }}</p>
                            <span class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                                Read full notice
                                <svg class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                            </span>
                        </div>
                        <div v-if="featured.image_url" class="shrink-0 lg:w-80">
                            <img :src="featured.image_url" alt="" class="h-48 w-full rounded-2xl object-cover shadow-lg ring-1 ring-white/20 transition duration-500 group-hover:scale-[1.02] lg:h-52" />
                        </div>
                    </div>
                </button>

                <!-- Grid of remaining notices -->
                <div v-if="rest.length" class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <button
                        v-for="(notice, i) in rest"
                        :key="notice.id"
                        class="group animate-fade-up relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/10"
                        :style="{ animationDelay: `${Math.min(i, 8) * 70}ms` }"
                        @click="emit('open', notice.id)"
                    >
                        <span class="absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 bg-gradient-to-r from-indigo-500 to-violet-600 transition-transform duration-300 group-hover:scale-x-100"></span>

                        <div v-if="notice.image_url" class="-mx-7 -mt-7 mb-5 h-44 overflow-hidden">
                            <img :src="notice.image_url" alt="" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        </div>

                        <div class="flex items-center justify-between">
                            <span class="inline-flex items-center gap-2 text-sm font-medium text-slate-400">
                                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" stroke-linecap="round" /></svg>
                                {{ formatDate(notice.published_at || notice.created_at) }}
                            </span>
                            <span v-if="isFresh(notice)" class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-emerald-600 ring-1 ring-inset ring-emerald-100">New</span>
                        </div>

                        <h3 class="mt-4 text-lg font-bold text-slate-900 transition group-hover:text-indigo-600">{{ notice.title }}</h3>
                        <p class="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">{{ excerpt(notice.body) }}</p>

                        <span class="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                            Read more
                            <svg class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                        </span>
                    </button>
                </div>

                <!-- Empty state -->
                <div v-if="!featured && !rest.length" class="animate-fade-in mt-16 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 py-20 text-center">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-3xl">📭</div>
                    <p class="mt-5 text-lg font-semibold text-slate-700">{{ search ? 'No notices match your search' : 'No notices yet' }}</p>
                    <p class="mt-1 text-sm text-slate-400">{{ search ? 'Try a different keyword.' : 'Check back soon for announcements.' }}</p>
                </div>
            </template>
        </div>
    </div>
</template>
