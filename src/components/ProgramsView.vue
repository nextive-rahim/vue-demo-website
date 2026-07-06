<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';

const props = defineProps({
    initialCategory: { type: String, default: 'all' },
});

const emit = defineEmits(['back']);

const programs = ref([]);
const loading = ref(true);
const error = ref(null);
const filter = ref(props.initialCategory || 'all');

const tabs = [
    { key: 'all', label: 'All' },
    { key: 'academic', label: 'Academic' },
    { key: 'skills', label: 'Skills' },
    { key: 'admission', label: 'Admission' },
    { key: 'job', label: 'Job Prep' },
];

async function load() {
    loading.value = true;
    error.value = null;
    try {
        programs.value = (await api.programs()).data;
    } catch (e) {
        error.value = 'Could not load programs.';
    } finally {
        loading.value = false;
    }
}

const shown = computed(() => (filter.value === 'all' ? programs.value : programs.value.filter((p) => p.category === filter.value)));

function money(n) {
    return new Intl.NumberFormat('en-US').format(n);
}

const badge = { academic: 'bg-indigo-50 text-indigo-600', skills: 'bg-violet-50 text-violet-600', admission: 'bg-amber-50 text-amber-600', job: 'bg-emerald-50 text-emerald-600' };
const cover = { academic: 'from-indigo-500 to-violet-600', skills: 'from-violet-500 to-fuchsia-600', admission: 'from-amber-500 to-orange-600', job: 'from-emerald-500 to-teal-600' };

watch(() => props.initialCategory, (c) => (filter.value = c || 'all'));
onMounted(load);
</script>

<template>
    <div class="relative overflow-hidden">
        <div class="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-200/60 to-violet-200/60 blur-3xl"></div>

        <div class="relative mx-auto max-w-7xl px-5 py-14 sm:px-6">
            <div class="animate-fade-up">
                <button class="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="emit('back')">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    Home
                </button>
                <span class="text-sm font-bold uppercase tracking-widest text-indigo-500">Programs</span>
                <h1 class="mt-2 text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">Academic <span class="text-gradient">batches</span> &amp; more</h1>
                <p class="mt-3 max-w-lg text-lg text-slate-500">Structured programs for academics, skills, admission and job preparation.</p>

                <div class="mt-6 flex flex-wrap gap-1.5 rounded-full bg-slate-100 p-1.5">
                    <button v-for="t in tabs" :key="t.key" class="rounded-full px-4 py-2 text-sm font-semibold transition" :class="filter === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'" @click="filter = t.key">{{ t.label }}</button>
                </div>
            </div>

            <AlertMessage type="error" :message="error" class="mt-8" />

            <div v-if="loading" class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="i in 6" :key="i" class="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                    <div class="skeleton h-36 w-full"></div><div class="p-6"><div class="skeleton h-5 w-2/3 rounded"></div></div>
                </div>
            </div>

            <div v-else class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <button
                    v-for="(program, i) in shown"
                    :key="program.id"
                    class="group animate-fade-up flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10"
                    :style="{ animationDelay: `${Math.min(i, 9) * 60}ms` }"
                >
                    <div class="relative h-36 overflow-hidden">
                        <img v-if="program.thumbnail_url" :src="program.thumbnail_url" alt="" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        <div v-else :class="`flex h-full w-full items-center justify-center bg-gradient-to-br ${cover[program.category]} text-5xl font-black text-white/90`">{{ program.title.charAt(0) }}</div>
                        <span class="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase shadow-sm backdrop-blur" :class="badge[program.category]">{{ program.category }}</span>
                    </div>
                    <div class="flex flex-1 flex-col p-5">
                        <h3 class="font-bold text-slate-900 transition group-hover:text-indigo-600">{{ program.title }}</h3>
                        <p v-if="program.subtitle" class="mt-1 text-sm text-slate-500">{{ program.subtitle }}</p>
                        <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                            <div>
                                <template v-if="!program.price"><span class="text-base font-black text-indigo-600">Free</span></template>
                                <template v-else-if="program.discount_price"><span class="text-base font-black text-slate-900">৳{{ money(program.discount_price) }}</span><span class="ml-1.5 text-xs text-slate-400 line-through">৳{{ money(program.price) }}</span></template>
                                <template v-else><span class="text-base font-black text-slate-900">৳{{ money(program.price) }}</span></template>
                            </div>
                            <span class="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">Enroll →</span>
                        </div>
                    </div>
                </button>

                <div v-if="!shown.length" class="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 py-20 text-center">
                    <div class="text-3xl">🎓</div><p class="mt-4 text-lg font-semibold text-slate-700">No programs in this category yet</p>
                </div>
            </div>
        </div>
    </div>
</template>
