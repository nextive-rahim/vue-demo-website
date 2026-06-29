<script setup>
defineProps({
    user: { type: Object, default: null },
    active: { type: String, default: 'home' },
});

const emit = defineEmits(['navigate', 'login', 'account']);

const navItems = [
    { label: 'Courses', action: 'courses' },
    { label: 'Features', action: 'home' },
    { label: "Student's Review", action: 'home' },
    { label: 'Success Gallery', action: 'home' },
    { label: 'Notice', action: 'home' },
    { label: 'About us', action: 'home' },
    { label: 'Blog and News', action: 'home' },
];
</script>

<template>
    <header class="sticky top-0 z-20 bg-white/90 backdrop-blur">
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
            <!-- Logo -->
            <button class="flex shrink-0 items-center gap-2" @click="emit('navigate', 'home')">
                <span class="bg-gradient-to-br from-indigo-500 to-violet-600 bg-clip-text text-4xl font-black leading-none text-transparent">D</span>
                <span class="leading-none">
                    <span class="block text-xl font-extrabold text-slate-900">Demo Website</span>
                    <span class="block text-[10px] font-semibold tracking-[0.25em] text-slate-400">IT'S POSSIBLE</span>
                </span>
            </button>

            <!-- Pill nav -->
            <nav class="hidden items-center gap-1 rounded-full bg-slate-100 px-2 py-2 xl:flex">
                <button
                    v-for="item in navItems"
                    :key="item.label"
                    class="rounded-full px-4 py-2 text-sm font-semibold transition"
                    :class="active === item.action && item.action !== 'home'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:bg-white hover:text-slate-900'"
                    @click="emit('navigate', item.action)"
                >
                    {{ item.label }}
                </button>
            </nav>

            <!-- Auth / account -->
            <button
                v-if="!user"
                class="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-95"
                @click="emit('login')"
            >
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" stroke-linecap="round" />
                </svg>
                Login/SignUp
            </button>

            <button
                v-else
                class="flex shrink-0 items-center gap-2 rounded-full bg-slate-100 py-2 pl-2 pr-4 font-semibold text-slate-800 transition hover:bg-slate-200"
                @click="emit('account')"
            >
                <img v-if="user.avatar_url" :src="user.avatar_url" alt="" class="h-8 w-8 rounded-full object-cover" />
                <span v-else class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                    {{ (user.name || '?').charAt(0).toUpperCase() }}
                </span>
                <span class="hidden sm:inline">{{ user.name }}</span>
            </button>
        </div>
    </header>
</template>
