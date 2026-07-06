<script setup>
const emit = defineEmits(['select']);

const categories = [
    { key: 'academic', label: 'Academic', desc: 'HSC, SSC & school', icon: '🎓', color: 'from-indigo-500 to-violet-600' },
    { key: 'skills', label: 'Skills', desc: 'Job-ready skills', icon: '⚡', color: 'from-violet-500 to-fuchsia-600' },
    { key: 'admission', label: 'Admission', desc: 'University & medical', icon: '🎯', color: 'from-amber-500 to-orange-600' },
    { key: 'job', label: 'Job Prep', desc: 'BCS, bank & more', icon: '💼', color: 'from-emerald-500 to-teal-600' },
];
</script>

<template>
    <section class="mx-auto max-w-7xl px-5 py-16 sm:px-6">
        <div v-reveal class="mx-auto mb-10 max-w-2xl text-center">
            <span class="text-sm font-bold uppercase tracking-widest text-indigo-500">Explore by category</span>
            <h2 class="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">What do you want to learn?</h2>
        </div>

        <div class="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            <button
                v-for="(c, i) in categories"
                :key="c.key"
                v-reveal="{ delay: i * 80 }"
                class="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10 sm:p-8"
                @click="emit('select', c.key)"
            >
                <div :class="`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${c.color} text-2xl shadow-lg transition group-hover:scale-110`">{{ c.icon }}</div>
                <h3 class="mt-5 text-lg font-bold text-slate-900 transition group-hover:text-indigo-600">{{ c.label }}</h3>
                <p class="mt-1 text-sm text-slate-500">{{ c.desc }}</p>
                <span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                    Browse
                    <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </span>
                <span class="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-100 to-transparent opacity-0 blur-2xl transition group-hover:opacity-100"></span>
            </button>
        </div>
    </section>
</template>
