<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { api } from '../api';

const ads = ref([]);
const index = ref(0);
let timer = null;

async function load() {
    try {
        ads.value = (await api.advertisements('home')).data;
    } catch {
        ads.value = [];
    }
}

function go(i) {
    const n = ads.value.length;
    if (!n) return;
    index.value = ((i % n) + n) % n;
    restart();
}

function next() {
    go(index.value + 1);
}

function prev() {
    go(index.value - 1);
}

function open(ad) {
    if (ad.link_url) window.open(ad.link_url, '_blank', 'noopener');
}

function restart() {
    stop();
    timer = setInterval(next, 5000);
}

function stop() {
    if (timer) clearInterval(timer);
    timer = null;
}

onMounted(async () => {
    await load();
    if (ads.value.length > 1) restart();
});

onUnmounted(stop);
</script>

<template>
    <section v-if="ads.length" class="relative overflow-hidden py-14 sm:py-16">
        <!-- Ambient themed backdrop -->
        <div class="pointer-events-none absolute inset-0 -z-10">
            <div class="absolute inset-0 bg-gradient-to-b from-indigo-50/60 via-white to-white"></div>
            <div class="animate-blob absolute -left-20 top-10 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-200/50 to-violet-200/50 blur-3xl"></div>
            <div class="animate-blob absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-gradient-to-br from-fuchsia-200/40 to-indigo-200/40 blur-3xl" style="animation-delay: -6s"></div>
        </div>

        <div v-reveal class="mx-auto mb-8 max-w-6xl px-5 text-center sm:px-6">
            <span class="text-sm font-bold uppercase tracking-widest text-indigo-500">Sponsored</span>
            <h2 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Special offers for you</h2>
        </div>

        <div class="mx-auto max-w-6xl px-5 sm:px-6" @mouseenter="stop" @mouseleave="ads.length > 1 && restart()">
            <!-- Viewport -->
            <div class="group relative overflow-hidden rounded-[1.75rem] shadow-2xl shadow-indigo-500/15 ring-1 ring-slate-200/70">
                <!-- Track -->
                <div class="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" :style="{ transform: `translateX(-${index * 100}%)` }">
                    <div v-for="ad in ads" :key="ad.id" class="w-full shrink-0">
                        <component
                            :is="ad.link_url ? 'button' : 'div'"
                            class="relative block h-64 w-full text-left sm:h-80 md:h-96 lg:h-[28rem]"
                            :class="ad.link_url ? 'cursor-pointer' : ''"
                            @click="open(ad)"
                        >
                            <img v-if="ad.image_url" :src="ad.image_url" :alt="ad.title" class="h-full w-full object-cover" />
                            <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600">
                                <div class="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                            </div>

                            <!-- Caption overlay -->
                            <div v-if="ad.title || ad.description" class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent p-6 sm:p-8">
                                <div class="max-w-2xl">
                                    <span class="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-inset ring-white/30 backdrop-blur">Ad</span>
                                    <h3 class="mt-2 text-xl font-bold text-white drop-shadow sm:text-2xl">{{ ad.title }}</h3>
                                    <p v-if="ad.description" class="mt-1 line-clamp-2 text-sm text-white/80 sm:text-base">{{ ad.description }}</p>
                                    <span v-if="ad.link_url" class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 shadow">
                                        Learn more
                                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                                    </span>
                                </div>
                            </div>
                        </component>
                    </div>
                </div>

                <!-- Prev / Next arrows -->
                <template v-if="ads.length > 1">
                    <button
                        class="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 opacity-0 shadow-lg ring-1 ring-slate-200 backdrop-blur transition hover:bg-white group-hover:opacity-100"
                        aria-label="Previous"
                        @click.stop="prev"
                    >
                        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    </button>
                    <button
                        class="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 opacity-0 shadow-lg ring-1 ring-slate-200 backdrop-blur transition hover:bg-white group-hover:opacity-100"
                        aria-label="Next"
                        @click.stop="next"
                    >
                        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    </button>
                </template>
            </div>

            <!-- Dot indicators -->
            <div v-if="ads.length > 1" class="mt-6 flex items-center justify-center gap-2.5">
                <button
                    v-for="(ad, i) in ads"
                    :key="ad.id"
                    class="h-2.5 rounded-full transition-all duration-300"
                    :class="i === index ? 'w-7 bg-gradient-to-r from-indigo-500 to-violet-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'"
                    :aria-label="`Go to slide ${i + 1}`"
                    @click="go(i)"
                ></button>
            </div>
        </div>
    </section>
</template>
