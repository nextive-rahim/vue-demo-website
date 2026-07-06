<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

defineProps({
    user: { type: Object, default: null },
    active: { type: String, default: 'home' },
});

const emit = defineEmits(['navigate', 'login', 'account']);

// Keep a nav item lit while viewing a detail page that belongs to it.
const activeGroups = {
    courses: ['courses', 'courseDetail'],
    programs: ['programs'],
    live: ['live'],
    free: ['free'],
    notices: ['notices', 'noticeDetail'],
    reviews: ['reviews'],
    blog: ['blog', 'postDetail'],
    about: ['about'],
};

function isActive(action, active) {
    return (activeGroups[action] ?? []).includes(active);
}

const navItems = [
    { label: 'Courses', action: 'courses' },
    { label: 'Programs', action: 'programs' },
    { label: 'Live', action: 'live' },
    { label: 'Free', action: 'free' },
    { label: 'Reviews', action: 'reviews' },
    { label: 'Notice', action: 'notices' },
    { label: 'Blog', action: 'blog' },
    { label: 'About', action: 'about' },
];

const scrolled = ref(false);
const menuOpen = ref(false);

function onScroll() {
    scrolled.value = window.scrollY > 12;
}

function go(action) {
    menuOpen.value = false;
    emit('navigate', action);
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
    <header
        class="sticky top-0 z-40 transition-all duration-300"
        :class="scrolled ? 'border-b border-slate-200/70 bg-white/80 shadow-sm shadow-slate-200/50 backdrop-blur-xl' : 'bg-transparent'"
    >
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
            <!-- Logo -->
            <button class="group flex shrink-0 items-center gap-2.5" @click="go('home')">
                <span class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-black text-white shadow-lg shadow-indigo-500/30 transition group-hover:scale-105">
                    D
                    <span class="absolute inset-0 rounded-xl bg-white/20 opacity-0 transition group-hover:opacity-100"></span>
                </span>
                <span class="leading-none">
                    <span class="block text-lg font-extrabold tracking-tight text-slate-900">Demo Website</span>
                    <span class="block text-[10px] font-semibold tracking-[0.25em] text-indigo-400">IT'S POSSIBLE</span>
                </span>
            </button>

            <!-- Desktop pill nav -->
            <nav class="hidden items-center gap-0.5 rounded-full border border-slate-200/70 bg-white/70 px-1.5 py-1.5 shadow-sm backdrop-blur xl:flex">
                <button
                    v-for="item in navItems"
                    :key="item.label"
                    class="relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200"
                    :class="isActive(item.action, active)
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30'
                        : 'text-slate-600 hover:text-indigo-600'"
                    @click="go(item.action)"
                >
                    {{ item.label }}
                </button>
            </nav>

            <div class="flex items-center gap-2">
                <!-- Auth / account -->
                <button
                    v-if="!user"
                    class="group relative hidden shrink-0 items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl hover:shadow-indigo-500/40 sm:flex"
                    @click="emit('login')"
                >
                    <span class="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full"></span>
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" stroke-linecap="round" /></svg>
                    Login / SignUp
                </button>

                <button
                    v-else
                    class="flex shrink-0 items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-300"
                    @click="emit('account')"
                >
                    <img v-if="user.avatar_url" :src="user.avatar_url" alt="" class="h-8 w-8 rounded-full object-cover" />
                    <span v-else class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                        {{ (user.name || '?').charAt(0).toUpperCase() }}
                    </span>
                    <span class="hidden text-sm sm:inline">{{ user.name }}</span>
                </button>

                <!-- Mobile menu toggle -->
                <button
                    class="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 xl:hidden"
                    aria-label="Menu"
                    @click="menuOpen = !menuOpen"
                >
                    <svg v-if="!menuOpen" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" /></svg>
                    <svg v-else class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" /></svg>
                </button>
            </div>
        </div>

        <!-- Mobile menu -->
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="-translate-y-4 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="translate-y-0 opacity-100"
            leave-to-class="-translate-y-4 opacity-0"
        >
            <div v-if="menuOpen" class="border-t border-slate-200/70 bg-white/95 backdrop-blur-xl xl:hidden">
                <nav class="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4 sm:px-6">
                    <button
                        v-for="item in navItems"
                        :key="item.label"
                        class="rounded-xl px-4 py-3 text-left text-sm font-semibold transition"
                        :class="isActive(item.action, active) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'"
                        @click="go(item.action)"
                    >
                        {{ item.label }}
                    </button>
                    <button
                        v-if="!user"
                        class="mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/30"
                        @click="menuOpen = false; emit('login')"
                    >
                        Login / SignUp
                    </button>
                </nav>
            </div>
        </Transition>
    </header>
</template>
