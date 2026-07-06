<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api';

const ads = ref([]);

async function load() {
    try {
        ads.value = (await api.advertisements('home')).data;
    } catch {
        ads.value = [];
    }
}

function open(ad) {
    if (ad.link_url) window.open(ad.link_url, '_blank', 'noopener');
}

onMounted(load);
</script>

<template>
    <section v-if="ads.length" class="mx-auto max-w-7xl px-5 py-10 sm:px-6">
        <div v-reveal class="mb-8 text-center">
            <span class="text-sm font-bold uppercase tracking-widest text-indigo-500">Sponsored</span>
            <h2 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Special offers for you</h2>
        </div>

        <div class="grid grid-cols-1 gap-6" :class="ads.length === 1 ? 'max-w-3xl mx-auto' : 'md:grid-cols-2'">
            <component
                :is="ad.link_url ? 'button' : 'div'"
                v-for="(ad, i) in ads"
                :key="ad.id"
                v-reveal="{ delay: i * 90 }"
                class="group relative flex w-full overflow-hidden rounded-3xl text-left shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 transition duration-300"
                :class="ad.link_url ? 'hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/15' : ''"
                @click="open(ad)"
            >
                <!-- With image: image side + copy side -->
                <template v-if="ad.image_url">
                    <div class="relative w-2/5 shrink-0 overflow-hidden">
                        <img :src="ad.image_url" alt="" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    </div>
                    <div class="flex flex-1 flex-col justify-center bg-white p-6">
                        <span class="mb-2 w-max rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600">Ad</span>
                        <h3 class="text-lg font-bold text-slate-900 transition group-hover:text-indigo-600">{{ ad.title }}</h3>
                        <p v-if="ad.description" class="mt-1.5 line-clamp-2 text-sm text-slate-500">{{ ad.description }}</p>
                        <span v-if="ad.link_url" class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                            Learn more
                            <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                        </span>
                    </div>
                </template>

                <!-- No image: gradient promo -->
                <div v-else class="relative w-full overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600 p-8">
                    <div class="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
                    <span class="w-max rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-inset ring-white/30">Ad</span>
                    <h3 class="mt-3 text-xl font-bold text-white">{{ ad.title }}</h3>
                    <p v-if="ad.description" class="mt-2 text-indigo-100">{{ ad.description }}</p>
                    <span v-if="ad.link_url" class="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                        Learn more
                        <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    </span>
                </div>
            </component>
        </div>
    </section>
</template>
