<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api';

const ad = ref(null);
const open = ref(false);

const STORAGE_KEY = 'ad_popup_seen';

async function load() {
    // Only show the popup once per browser session.
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    try {
        const list = (await api.advertisements('popup')).data;
        if (list.length) {
            ad.value = list[0];
            setTimeout(() => {
                open.value = true;
            }, 1200);
        }
    } catch {
        // Ignore — no popup.
    }
}

function close() {
    open.value = false;
    sessionStorage.setItem(STORAGE_KEY, '1');
}

function go() {
    if (ad.value?.link_url) window.open(ad.value.link_url, '_blank', 'noopener');
    close();
}

onMounted(load);
</script>

<template>
    <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
    >
        <div v-if="open && ad" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm" @click.self="close">
            <div class="animate-scale-in relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
                <button class="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow ring-1 ring-slate-200 backdrop-blur transition hover:text-slate-900" aria-label="Close" @click="close">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" /></svg>
                </button>

                <img v-if="ad.image_url" :src="ad.image_url" alt="" class="h-52 w-full object-cover" />
                <div v-else class="relative h-28 overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600">
                    <div class="animate-blob absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15 blur-2xl"></div>
                </div>

                <div class="p-7 text-center">
                    <span class="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600">Special offer</span>
                    <h3 class="mt-4 text-2xl font-black tracking-tight text-slate-900">{{ ad.title }}</h3>
                    <p v-if="ad.description" class="mt-2 text-slate-500">{{ ad.description }}</p>
                    <div class="mt-6 flex flex-col gap-2">
                        <button v-if="ad.link_url" class="rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5" @click="go">
                            Grab the offer
                        </button>
                        <button class="rounded-full px-6 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700" @click="close">
                            No thanks
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>
