<script setup>
const emit = defineEmits(['navigate']);

const columns = [
    {
        title: 'Learn',
        links: [
            { label: 'Courses', action: 'courses' },
            { label: 'Programs', action: 'programs' },
            { label: 'Live classes', action: 'live' },
            { label: 'Free resources', action: 'free' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About us', action: 'about' },
            { label: 'Blog and news', action: 'blog' },
            { label: 'Student reviews', action: 'reviews' },
            { label: 'Notice board', action: 'notices' },
        ],
    },
    {
        title: 'Support',
        links: [
            { label: 'Help center', action: 'home' },
            { label: 'Contact', action: 'home' },
            { label: 'Privacy policy', action: 'home' },
            { label: 'Terms', action: 'home' },
        ],
    },
];

const socials = ['Facebook', 'YouTube', 'Instagram', 'LinkedIn'];
</script>

<template>
    <footer class="relative mt-10 overflow-hidden bg-slate-900 text-slate-300">
        <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
        <div class="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl"></div>

        <div class="relative mx-auto max-w-7xl px-5 py-16 sm:px-6">
            <div class="grid grid-cols-2 gap-10 md:grid-cols-6">
                <!-- Brand + newsletter -->
                <div class="col-span-2 md:col-span-3">
                    <button class="flex items-center gap-2.5" @click="emit('navigate', 'home')">
                        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-black text-white">D</span>
                        <span class="leading-none">
                            <span class="block text-lg font-extrabold text-white">Demo Website</span>
                            <span class="block text-[10px] font-semibold tracking-[0.25em] text-indigo-400">IT'S POSSIBLE</span>
                        </span>
                    </button>
                    <p class="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
                        A complete learning platform — notes, PDFs, videos, live classes and exams, all in one beautiful place.
                    </p>

                    <form class="mt-6 flex max-w-sm gap-2" @submit.prevent>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            class="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                        />
                        <button class="shrink-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-95">
                            Subscribe
                        </button>
                    </form>
                </div>

                <!-- Link columns -->
                <div v-for="col in columns" :key="col.title">
                    <h3 class="text-sm font-bold text-white">{{ col.title }}</h3>
                    <ul class="mt-4 space-y-2.5">
                        <li v-for="link in col.links" :key="link.label">
                            <button class="text-sm text-slate-400 transition hover:text-indigo-300" @click="emit('navigate', link.action)">
                                {{ link.label }}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
                <p class="text-sm text-slate-500">© {{ new Date().getFullYear() }} Demo Website. All rights reserved.</p>
                <div class="flex gap-3">
                    <a
                        v-for="s in socials"
                        :key="s"
                        href="#"
                        class="flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-400 transition hover:border-indigo-400/50 hover:text-indigo-300"
                    >{{ s }}</a>
                </div>
            </div>
        </div>
    </footer>
</template>
