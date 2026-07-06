<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api';
import AlertMessage from './AlertMessage.vue';

const emit = defineEmits(['back']);

const reviews = ref([]);
const loading = ref(true);
const error = ref(null);
const activeVideo = ref(null);

async function load() {
    loading.value = true;
    error.value = null;
    try {
        reviews.value = (await api.studentReviews()).data;
    } catch (e) {
        error.value = 'Could not load student reviews.';
    } finally {
        loading.value = false;
    }
}

/** Convert a YouTube/Vimeo URL into an embeddable player URL. */
function embedUrl(url) {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
    return null;
}

function openVideo(review) {
    const embed = embedUrl(review.video_url);
    if (embed) {
        activeVideo.value = embed;
    } else if (review.video_url) {
        window.open(review.video_url, '_blank');
    }
}

onMounted(load);
</script>

<template>
    <div class="relative overflow-hidden">
        <div class="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-200/60 to-violet-200/60 blur-3xl"></div>
        <div class="pointer-events-none absolute -right-40 top-52 h-80 w-80 rounded-full bg-gradient-to-br from-fuchsia-100 to-indigo-100 blur-3xl"></div>

        <div class="relative mx-auto max-w-7xl px-5 py-14 sm:px-6">
            <!-- Header -->
            <div class="animate-fade-up text-center">
                <button class="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="emit('back')">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    Home
                </button>
                <span class="text-sm font-bold uppercase tracking-widest text-indigo-500">Success stories</span>
                <h1 class="mt-2 text-4xl font-black tracking-tight text-slate-900 lg:text-5xl">Student <span class="text-gradient">reviews</span></h1>
                <p class="mx-auto mt-3 max-w-xl text-lg text-slate-500">Real students, real results. Hear from the learners who made it happen with Demo Website.</p>
            </div>

            <AlertMessage type="error" :message="error" class="mt-8" />

            <!-- Loading -->
            <div v-if="loading" class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="i in 6" :key="i" class="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm">
                    <div class="flex items-center gap-4">
                        <div class="skeleton h-16 w-16 rounded-full"></div>
                        <div class="flex-1">
                            <div class="skeleton h-4 w-2/3 rounded"></div>
                            <div class="skeleton mt-2 h-3 w-1/2 rounded"></div>
                        </div>
                    </div>
                    <div class="skeleton mt-5 h-4 w-full rounded"></div>
                    <div class="skeleton mt-2 h-4 w-4/5 rounded"></div>
                </div>
            </div>

            <!-- Grid -->
            <div v-else class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <figure
                    v-for="(review, i) in reviews"
                    :key="review.id"
                    v-reveal="{ delay: (i % 3) * 90 }"
                    class="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
                >
                    <span class="pointer-events-none absolute right-6 top-5 font-serif text-6xl leading-none text-indigo-100 transition group-hover:text-indigo-200">”</span>

                    <div class="flex items-center gap-4">
                        <div class="relative shrink-0">
                            <img v-if="review.image_url" :src="review.image_url" :alt="review.name" class="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow" />
                            <span v-else class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white">{{ review.name.charAt(0) }}</span>
                            <button
                                v-if="review.video_url"
                                class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg ring-2 ring-white transition hover:scale-110"
                                title="Watch video"
                                @click="openVideo(review)"
                            >
                                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            </button>
                        </div>
                        <figcaption class="min-w-0">
                            <p class="truncate font-bold text-slate-900">{{ review.name }}</p>
                            <p class="truncate text-sm text-slate-500">{{ review.institute }}</p>
                        </figcaption>
                    </div>

                    <div class="mt-3 flex flex-wrap gap-2">
                        <span v-if="review.roll" class="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">Roll {{ review.roll }}</span>
                        <span v-if="review.batch" class="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-600">Batch {{ review.batch }}</span>
                    </div>

                    <blockquote v-if="review.review" class="mt-4 flex-1 text-sm leading-relaxed text-slate-600">{{ review.review }}</blockquote>

                    <button
                        v-if="review.video_url"
                        class="mt-5 inline-flex items-center gap-2 self-start rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                        @click="openVideo(review)"
                    >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                        Watch video story
                    </button>
                </figure>

                <div v-if="!reviews.length" class="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 py-20 text-center">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-3xl">⭐</div>
                    <p class="mt-5 text-lg font-semibold text-slate-700">No reviews yet</p>
                    <p class="mt-1 text-sm text-slate-400">Check back soon for student success stories.</p>
                </div>
            </div>
        </div>

        <!-- Video modal -->
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="activeVideo" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm" @click.self="activeVideo = null">
                <div class="animate-scale-in w-full max-w-3xl">
                    <div class="mb-3 flex justify-end">
                        <button class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20" @click="activeVideo = null">
                            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" /></svg>
                        </button>
                    </div>
                    <div class="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
                        <iframe :src="activeVideo" title="Student video" class="h-full w-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>
