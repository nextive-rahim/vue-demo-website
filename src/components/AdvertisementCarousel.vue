<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps({
    ads: { type: Array, default: () => [] },
});

const index = ref(0);
let timer = null;

function go(i) {
    const n = props.ads.length;
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
    if (props.ads.length > 1) timer = setInterval(next, 5000);
}

function stop() {
    if (timer) clearInterval(timer);
    timer = null;
}

onMounted(restart);
onUnmounted(stop);
</script>

<template>
    <div @mouseenter="stop" @mouseleave="restart">
        <!-- Viewport -->
        <div class="group relative overflow-hidden rounded-[2rem] shadow-2xl shadow-indigo-500/20 ring-1 ring-slate-200/70">
            <!-- Track -->
            <div class="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" :style="{ transform: `translateX(-${index * 100}%)` }">
                <div v-for="ad in ads" :key="ad.id" class="w-full shrink-0">
                    <component
                        :is="ad.link_url ? 'button' : 'div'"
                        class="relative block aspect-[4/3] w-full text-left"
                        :class="ad.link_url ? 'cursor-pointer' : ''"
                        @click="open(ad)"
                    >
                        <img v-if="ad.image_url" :src="ad.image_url" :alt="ad.title" class="h-full w-full object-cover" />
                        <div v-else class="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600">
                            <div class="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl"></div>
                            <div class="pointer-events-none absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
                            <span class="rounded-2xl bg-white/15 p-5 text-5xl ring-1 ring-inset ring-white/25 backdrop-blur">📣</span>
                        </div>

                        <!-- Caption overlay -->
                        <div v-if="ad.title || ad.description" class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/85 via-slate-900/35 to-transparent p-6">
                            <span class="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-inset ring-white/30 backdrop-blur">Ad</span>
                            <h3 class="mt-2 text-xl font-bold text-white drop-shadow">{{ ad.title }}</h3>
                            <p v-if="ad.description" class="mt-1 line-clamp-2 text-sm text-white/85">{{ ad.description }}</p>
                            <span v-if="ad.link_url" class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 shadow">
                                Learn more
                                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                            </span>
                        </div>
                    </component>
                </div>
            </div>

            <!-- Prev / Next arrows -->
            <template v-if="ads.length > 1">
                <button class="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 opacity-0 shadow-lg ring-1 ring-slate-200 backdrop-blur transition hover:bg-white group-hover:opacity-100" aria-label="Previous" @click.stop="prev">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
                <button class="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 opacity-0 shadow-lg ring-1 ring-slate-200 backdrop-blur transition hover:bg-white group-hover:opacity-100" aria-label="Next" @click.stop="next">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
            </template>
        </div>

        <!-- Dot indicators -->
        <div v-if="ads.length > 1" class="mt-5 flex items-center justify-center gap-2.5">
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
</template>
