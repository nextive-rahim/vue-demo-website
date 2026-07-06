<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { api } from '../api';

const ads = ref([]);
const index = ref(0);
const dismissed = ref(false);
let timer = null;

const current = computed(() => ads.value[index.value] ?? null);

async function load() {
    try {
        ads.value = (await api.advertisements('banner')).data;
    } catch {
        ads.value = [];
    }
}

function open(ad) {
    if (ad.link_url) window.open(ad.link_url, '_blank', 'noopener');
}

// Rotate through multiple banners every few seconds.
onMounted(() => {
    load();
    timer = setInterval(() => {
        if (ads.value.length > 1) index.value = (index.value + 1) % ads.value.length;
    }, 6000);
});

onUnmounted(() => {
    if (timer) clearInterval(timer);
});
</script>

<template>
    <Transition
        enter-active-class="transition duration-500 ease-out"
        enter-from-class="-translate-y-full opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-300 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-full opacity-0"
    >
        <div v-if="current && !dismissed" class="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
            <div class="pointer-events-none absolute inset-0 opacity-30">
                <div class="animate-blob absolute -left-10 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl"></div>
                <div class="animate-blob absolute -right-6 -bottom-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" style="animation-delay: -4s"></div>
            </div>
            <div class="relative mx-auto flex max-w-7xl items-center justify-center gap-3 px-10 py-2.5 text-center">
                <button
                    class="flex items-center gap-2 text-sm font-semibold text-white"
                    :class="current.link_url ? 'cursor-pointer hover:underline' : 'cursor-default'"
                    @click="open(current)"
                >
                    <span class="hidden rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ring-white/30 sm:inline">Ad</span>
                    <span class="line-clamp-1">{{ current.title }}</span>
                    <span v-if="current.link_url" class="hidden items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ring-white/30 sm:inline-flex">
                        Learn more →
                    </span>
                </button>
                <button class="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full text-white/80 transition hover:bg-white/20 hover:text-white" aria-label="Dismiss" @click="dismissed = true">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" /></svg>
                </button>
            </div>
        </div>
    </Transition>
</template>
