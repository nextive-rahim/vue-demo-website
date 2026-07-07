<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api';
import AdvertisementBanner from './AdvertisementBanner.vue';
import AdvertisementCarousel from './AdvertisementCarousel.vue';
import AdvertisementPopup from './AdvertisementPopup.vue';
import CourseCard from './CourseCard.vue';
import CategoryGrid from './CategoryGrid.vue';

const emit = defineEmits(['open', 'browse', 'login', 'programs']);

const courses = ref([]);
const loading = ref(true);
const homeAds = ref([]);

async function load() {
    try {
        courses.value = ((await api.courses()).data || []).slice(0, 3);
    } catch {
        courses.value = [];
    } finally {
        loading.value = false;
    }
}

async function loadAds() {
    try {
        homeAds.value = (await api.advertisements('home')).data;
    } catch {
        homeAds.value = [];
    }
}

// Editable from the admin "Home" tab; falls back to these defaults.
const hero = ref({
    hero_badge: '🚀 Learn at your own pace',
    hero_title: 'Learn anything.',
    hero_highlight: "It's possible.",
    hero_subtitle: 'Notes, PDFs, videos, live classes and exams — all in one beautiful place. Join Demo Website and start building skills that matter.',
});

const stats = ref([
    { value: '12k+', label: 'Active students' },
    { value: '250+', label: 'Expert lessons' },
    { value: '98%', label: 'Success rate' },
    { value: '4.9', label: 'Average rating' },
]);

async function loadSettings() {
    try {
        const { data } = await api.homeSettings();
        if (data.hero_title) {
            hero.value = {
                hero_badge: data.hero_badge || hero.value.hero_badge,
                hero_title: data.hero_title,
                hero_highlight: data.hero_highlight || '',
                hero_subtitle: data.hero_subtitle || hero.value.hero_subtitle,
            };
        }
        if (Array.isArray(data.stats) && data.stats.length) {
            stats.value = data.stats;
        }
    } catch {
        // Keep defaults.
    }
}

const features = [
    { icon: '📚', title: 'Rich content', text: 'Notes, PDFs, videos, live classes and exams — everything in one place.', color: 'from-indigo-500 to-blue-500' },
    { icon: '🎯', title: 'Smart exams', text: 'Auto-graded MCQ exams with instant results and live rankings.', color: 'from-violet-500 to-fuchsia-500' },
    { icon: '⚡', title: 'Learn live', text: 'Join scheduled live classes and never miss an important session.', color: 'from-amber-500 to-orange-500' },
    { icon: '📈', title: 'Track progress', text: 'Follow your journey with clear analytics and personalised feedback.', color: 'from-emerald-500 to-teal-500' },
];

const partners = ['Google', 'Meta', 'Amazon', 'Microsoft', 'Netflix', 'Spotify', 'Adobe', 'Stripe'];

const testimonials = [
    { name: 'Ayesha R.', role: 'Medical student', quote: 'The live exams and rankings kept me motivated every single day. My scores jumped within weeks.', avatar: 'A' },
    { name: 'Tanvir H.', role: 'University admission', quote: 'Clean, fast and everything I needed in one place. The video lessons are genuinely excellent.', avatar: 'T' },
    { name: 'Nadia K.', role: 'Job preparation', quote: 'I loved how organised the courses are. The notices kept me updated on new live classes.', avatar: 'N' },
];

onMounted(() => {
    load();
    loadAds();
    loadSettings();
});
</script>

<template>
    <div class="overflow-x-hidden">
        <!-- Advertisement banner (site promo strip) -->
        <AdvertisementBanner />

        <!-- Advertisement popup (shown once per session) -->
        <AdvertisementPopup />

        <!-- ============================ HERO ============================ -->
        <section class="relative isolate">
            <!-- Mesh gradient + animated blobs -->
            <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div class="absolute left-1/2 top-0 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-100 via-violet-100 to-transparent opacity-70 blur-3xl"></div>
                <div class="animate-blob absolute -left-24 top-40 h-80 w-80 bg-gradient-to-br from-indigo-300/40 to-blue-300/40 blur-3xl"></div>
                <div class="animate-blob absolute -right-16 top-24 h-96 w-96 bg-gradient-to-br from-violet-300/40 to-fuchsia-300/40 blur-3xl" style="animation-delay: -6s"></div>
            </div>

            <div class="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
                <!-- Copy -->
                <div class="text-center lg:text-left">
                    <span class="animate-fade-up inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/70 px-4 py-1.5 text-sm font-semibold text-indigo-600 shadow-sm backdrop-blur">
                        <span class="relative flex h-2 w-2">
                            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                            <span class="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                        </span>
                        {{ hero.hero_badge }}
                    </span>

                    <h1 class="animate-fade-up delay-100 mt-6 text-4xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl xl:text-7xl">
                        {{ hero.hero_title }}<br v-if="hero.hero_highlight" />
                        <span v-if="hero.hero_highlight" class="text-gradient">{{ hero.hero_highlight }}</span>
                    </h1>

                    <p class="animate-fade-up delay-200 mx-auto mt-6 max-w-xl text-lg text-slate-500 lg:mx-0">
                        {{ hero.hero_subtitle }}
                    </p>

                    <div class="animate-fade-up delay-300 mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                        <button
                            class="group relative overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40"
                            @click="emit('browse')"
                        >
                            <span class="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full"></span>
                            Browse courses
                        </button>
                        <button
                            class="rounded-full bg-white px-7 py-3.5 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-indigo-300"
                            @click="emit('login')"
                        >
                            Get started free
                        </button>
                    </div>

                    <!-- Inline stats -->
                    <dl class="animate-fade-up delay-500 mt-12 grid max-w-lg grid-cols-2 gap-6 sm:grid-cols-4 lg:mx-0">
                        <div v-for="s in stats" :key="s.label" class="text-center lg:text-left">
                            <dt class="text-2xl font-black text-slate-900 sm:text-3xl">{{ s.value }}</dt>
                            <dd class="mt-1 text-xs font-medium text-slate-500">{{ s.label }}</dd>
                        </div>
                    </dl>
                </div>

                <!-- Advertisement carousel (falls back to the product mockup when no ads) -->
                <div v-if="homeAds.length" class="animate-scale-in relative mx-auto w-full max-w-md">
                    <AdvertisementCarousel :ads="homeAds" />
                </div>

                <!-- Floating visual (shown when there are no ads) -->
                <div v-else class="animate-scale-in relative mx-auto hidden w-full max-w-md lg:block">
                    <div class="relative rounded-[2rem] bg-gradient-to-br from-indigo-500 to-violet-600 p-6 shadow-2xl shadow-indigo-500/30">
                        <div class="rounded-2xl bg-white/95 p-5 backdrop-blur">
                            <div class="flex items-center gap-3">
                                <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-black text-white">D</div>
                                <div>
                                    <div class="h-2.5 w-28 rounded-full bg-slate-200"></div>
                                    <div class="mt-2 h-2 w-20 rounded-full bg-slate-100"></div>
                                </div>
                            </div>
                            <div class="mt-5 space-y-3">
                                <div v-for="i in 3" :key="i" class="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                                    <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-lg">{{ ['🎬', '📝', '🎯'][i - 1] }}</div>
                                    <div class="flex-1">
                                        <div class="h-2.5 w-3/4 rounded-full bg-slate-200"></div>
                                        <div class="mt-1.5 h-2 w-1/2 rounded-full bg-slate-100"></div>
                                    </div>
                                    <div class="h-6 w-12 rounded-full bg-emerald-100"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Floating badge cards -->
                    <div class="animate-float absolute -left-10 top-10 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-slate-200/70 ring-1 ring-slate-100">
                        <span class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-lg">✅</span>
                        <div>
                            <p class="text-xs font-bold text-slate-900">Exam passed</p>
                            <p class="text-[10px] text-slate-400">Score 96%</p>
                        </div>
                    </div>
                    <div class="animate-float absolute -bottom-6 -right-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-slate-200/70 ring-1 ring-slate-100" style="animation-delay: -2.5s">
                        <span class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-lg">🏆</span>
                        <div>
                            <p class="text-xs font-bold text-slate-900">Rank #1</p>
                            <p class="text-[10px] text-slate-400">This week</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Trust marquee -->
            <div class="relative mx-auto max-w-7xl px-5 pb-10 sm:px-6">
                <p class="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Trusted by learners hired at</p>
                <div class="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
                    <div class="animate-marquee flex w-max items-center gap-12">
                        <span v-for="(p, i) in [...partners, ...partners]" :key="i" class="text-xl font-bold text-slate-300 transition hover:text-slate-400">{{ p }}</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- ============================ FEATURES ============================ -->
        <section class="mx-auto max-w-7xl px-5 py-20 sm:px-6">
            <div v-reveal class="mx-auto max-w-2xl text-center">
                <span class="text-sm font-bold uppercase tracking-widest text-indigo-500">Why Demo Website</span>
                <h2 class="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Everything you need to succeed</h2>
                <p class="mt-4 text-slate-500">A complete learning platform built to keep you focused, motivated and moving forward.</p>
            </div>

            <div class="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div
                    v-for="(f, i) in features"
                    :key="f.title"
                    v-reveal="{ delay: i * 90 }"
                    class="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10"
                >
                    <div :class="`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} text-2xl shadow-lg transition group-hover:scale-110`">{{ f.icon }}</div>
                    <h3 class="mt-5 text-lg font-bold text-slate-900">{{ f.title }}</h3>
                    <p class="mt-2 text-sm leading-relaxed text-slate-500">{{ f.text }}</p>
                    <span class="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-100 to-transparent opacity-0 blur-2xl transition group-hover:opacity-100"></span>
                </div>
            </div>
        </section>

        <!-- ============================ CATEGORY GRID ============================ -->
        <CategoryGrid @select="emit('programs', $event)" />

        <!-- ============================ STATS BAND ============================ -->
        <section class="px-5 sm:px-6">
            <div v-reveal class="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-14 shadow-2xl shadow-indigo-500/30 sm:px-12">
                <div class="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"></div>
                <div class="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
                <div class="relative grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
                    <div v-for="s in stats" :key="s.label">
                        <p class="text-4xl font-black text-white sm:text-5xl">{{ s.value }}</p>
                        <p class="mt-2 text-sm font-medium text-indigo-100">{{ s.label }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ============================ POPULAR COURSES ============================ -->
        <section class="mx-auto max-w-7xl px-5 py-20 sm:px-6">
            <div v-reveal class="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span class="text-sm font-bold uppercase tracking-widest text-indigo-500">Featured</span>
                    <h2 class="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Popular courses</h2>
                    <p class="mt-2 text-slate-500">Hand-picked to get you started on the right track.</p>
                </div>
                <button class="group inline-flex items-center gap-1.5 self-start rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 sm:self-auto" @click="emit('browse')">
                    View all
                    <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
            </div>

            <div v-if="loading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="i in 3" :key="i" class="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                    <div class="skeleton h-36 w-full"></div>
                    <div class="p-6">
                        <div class="skeleton h-5 w-2/3 rounded"></div>
                        <div class="skeleton mt-3 h-4 w-full rounded"></div>
                    </div>
                </div>
            </div>

            <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <CourseCard
                    v-for="(course, i) in courses"
                    :key="course.id"
                    v-reveal="{ delay: i * 90 }"
                    :course="course"
                    :index="i"
                    @open="emit('open', $event)"
                />

                <p v-if="!courses.length" class="col-span-full rounded-3xl border border-dashed border-slate-200 py-16 text-center text-slate-400">No courses available yet.</p>
            </div>
        </section>

        <!-- ============================ TESTIMONIALS ============================ -->
        <section class="bg-slate-50 py-20">
            <div class="mx-auto max-w-7xl px-5 sm:px-6">
                <div v-reveal class="mx-auto max-w-2xl text-center">
                    <span class="text-sm font-bold uppercase tracking-widest text-indigo-500">Loved by students</span>
                    <h2 class="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Real results, real people</h2>
                </div>
                <div class="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <figure
                        v-for="(t, i) in testimonials"
                        :key="t.name"
                        v-reveal="{ delay: i * 100 }"
                        class="flex flex-col rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100"
                    >
                        <div class="flex gap-1 text-amber-400">
                            <svg v-for="n in 5" :key="n" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9 4.8 17.2l1-5.8L1.5 7.2l5.9-.9z" /></svg>
                        </div>
                        <blockquote class="mt-4 flex-1 text-slate-600">"{{ t.quote }}"</blockquote>
                        <figcaption class="mt-6 flex items-center gap-3">
                            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white">{{ t.avatar }}</span>
                            <div>
                                <p class="text-sm font-bold text-slate-900">{{ t.name }}</p>
                                <p class="text-xs text-slate-400">{{ t.role }}</p>
                            </div>
                        </figcaption>
                    </figure>
                </div>
            </div>
        </section>

        <!-- ============================ CTA ============================ -->
        <section class="mx-auto max-w-7xl px-5 py-20 sm:px-6">
            <div v-reveal class="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-6 py-16 text-center shadow-2xl sm:px-12">
                <div class="pointer-events-none absolute inset-0 opacity-60">
                    <div class="animate-blob absolute -left-20 top-0 h-72 w-72 bg-gradient-to-br from-indigo-500/40 to-violet-500/40 blur-3xl"></div>
                    <div class="animate-blob absolute -right-10 bottom-0 h-80 w-80 bg-gradient-to-br from-fuchsia-500/30 to-indigo-500/30 blur-3xl" style="animation-delay: -5s"></div>
                </div>
                <div class="relative">
                    <h2 class="mx-auto max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">Ready to start your journey?</h2>
                    <p class="mx-auto mt-4 max-w-xl text-slate-300">Join thousands of learners building real skills. It's free to get started.</p>
                    <div class="mt-8 flex flex-wrap justify-center gap-3">
                        <button class="rounded-full bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5" @click="emit('login')">Create free account</button>
                        <button class="rounded-full bg-white/10 px-7 py-3.5 font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur transition hover:bg-white/20" @click="emit('browse')">Browse courses</button>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
