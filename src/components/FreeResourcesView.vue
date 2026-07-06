<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';

const emit = defineEmits(['back']);

const items = ref([]);
const loading = ref(true);
const error = ref(null);
const filter = ref('all');

const tabs = [
    { key: 'all', label: 'All' },
    { key: 'note', label: 'Notes' },
    { key: 'pdf', label: 'PDFs' },
    { key: 'book', label: 'Books' },
];

async function load() {
    loading.value = true;
    error.value = null;
    try {
        items.value = (await api.freeResources()).data;
    } catch (e) {
        error.value = 'Could not load free resources.';
    } finally {
        loading.value = false;
    }
}

const shown = computed(() => (filter.value === 'all' ? items.value : items.value.filter((r) => r.type === filter.value)));

function open(item) {
    if (item.file_url) window.open(item.file_url, '_blank', 'noopener');
}

const meta = {
    note: { icon: '📝', color: 'from-amber-400 to-orange-500', badge: 'bg-amber-50 text-amber-600' },
    pdf: { icon: '📄', color: 'from-rose-400 to-red-500', badge: 'bg-rose-50 text-rose-600' },
    book: { icon: '📚', color: 'from-indigo-400 to-violet-500', badge: 'bg-indigo-50 text-indigo-600' },
};

onMounted(load);
</script>

<template>
    <div class="relative overflow-hidden">
        <div class="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-200/50 to-indigo-200/50 blur-3xl"></div>

        <div class="relative mx-auto max-w-7xl px-5 py-14 sm:px-6">
            <div class="animate-fade-up">
                <button class="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="emit('back')">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    Home
                </button>
                <span class="text-sm font-bold uppercase tracking-widest text-indigo-500">100% Free</span>
                <h1 class="mt-2 text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">Free <span class="text-gradient">resources</span></h1>
                <p class="mt-3 max-w-lg text-lg text-slate-500">Download free notes, PDFs and books — no sign-up required.</p>

                <div class="mt-6 flex flex-wrap gap-1.5 rounded-full bg-slate-100 p-1.5">
                    <button v-for="t in tabs" :key="t.key" class="rounded-full px-4 py-2 text-sm font-semibold transition" :class="filter === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'" @click="filter = t.key">{{ t.label }}</button>
                </div>
            </div>

            <AlertMessage type="error" :message="error" class="mt-8" />

            <div v-if="loading" class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="i in 6" :key="i" class="skeleton h-40 rounded-3xl"></div>
            </div>

            <div v-else class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <button
                    v-for="(item, i) in shown"
                    :key="item.id"
                    v-reveal="{ delay: (i % 3) * 80 }"
                    class="group flex items-start gap-4 rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
                    @click="open(item)"
                >
                    <div :class="`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta[item.type].color} text-2xl shadow-lg`">{{ meta[item.type].icon }}</div>
                    <div class="min-w-0 flex-1">
                        <span class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" :class="meta[item.type].badge">{{ item.type }}</span>
                        <h3 class="mt-2 font-bold text-slate-900 transition group-hover:text-indigo-600">{{ item.title }}</h3>
                        <p v-if="item.description" class="mt-1 line-clamp-2 text-sm text-slate-500">{{ item.description }}</p>
                        <span v-if="item.file_url" class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                            Download
                            <svg class="h-4 w-4 transition-transform group-hover:translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" stroke-linecap="round" stroke-linejoin="round" /></svg>
                        </span>
                    </div>
                </button>

                <div v-if="!shown.length" class="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 py-20 text-center">
                    <div class="text-3xl">📭</div><p class="mt-4 text-lg font-semibold text-slate-700">Nothing here yet</p>
                </div>
            </div>
        </div>
    </div>
</template>
