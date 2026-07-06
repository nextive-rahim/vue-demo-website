<script setup>
const props = defineProps({
    course: { type: Object, required: true },
    index: { type: Number, default: 0 },
});

const emit = defineEmits(['open']);

const gradients = [
    'from-indigo-500 to-violet-600',
    'from-violet-500 to-fuchsia-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
];

function money(n) {
    return new Intl.NumberFormat('en-US').format(n);
}
</script>

<template>
    <button
        class="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10"
        @click="emit('open', course.id)"
    >
        <!-- Thumbnail -->
        <div class="relative h-40 overflow-hidden">
            <img v-if="course.thumbnail_url" :src="course.thumbnail_url" :alt="course.title" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div v-else :class="`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradients[index % gradients.length]} text-5xl font-black text-white/90`">
                <span class="transition duration-500 group-hover:scale-125">{{ course.title.charAt(0) }}</span>
            </div>
            <span class="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">{{ course.contents_count ?? 0 }} lessons</span>
        </div>

        <div class="flex flex-1 flex-col p-5">
            <h3 class="font-bold leading-snug text-slate-900 transition group-hover:text-indigo-600">{{ course.title }}</h3>

            <!-- Instructor -->
            <div v-if="course.instructor_name" class="mt-3 flex items-center gap-2">
                <img v-if="course.instructor_image_url" :src="course.instructor_image_url" alt="" class="h-7 w-7 rounded-full object-cover ring-1 ring-slate-200" />
                <span v-else class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">{{ course.instructor_name.charAt(0) }}</span>
                <span class="truncate text-xs font-medium text-slate-500">{{ course.instructor_name }}</span>
            </div>
            <p v-else class="mt-3 line-clamp-2 text-sm text-slate-500">{{ course.description }}</p>

            <!-- Rating -->
            <div v-if="course.rating" class="mt-3 flex items-center gap-1.5">
                <div class="flex text-amber-400">
                    <svg v-for="n in 5" :key="n" class="h-3.5 w-3.5" viewBox="0 0 20 20" :fill="n <= Math.round(course.rating) ? 'currentColor' : '#e2e8f0'"><path d="M10 1l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9 4.8 17.2l1-5.8L1.5 7.2l5.9-.9z" /></svg>
                </div>
                <span class="text-xs font-semibold text-slate-700">{{ course.rating }}</span>
                <span v-if="course.rating_count" class="text-xs text-slate-400">({{ money(course.rating_count) }})</span>
            </div>

            <!-- Price + CTA -->
            <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                    <template v-if="!course.price">
                        <span class="text-base font-black text-indigo-600">Free</span>
                    </template>
                    <template v-else-if="course.discount_price">
                        <span class="text-base font-black text-slate-900">৳{{ money(course.discount_price) }}</span>
                        <span class="ml-1.5 text-xs text-slate-400 line-through">৳{{ money(course.price) }}</span>
                    </template>
                    <template v-else>
                        <span class="text-base font-black text-slate-900">৳{{ money(course.price) }}</span>
                    </template>
                </div>
                <span class="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                    Enroll
                    <svg class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </span>
            </div>
        </div>
    </button>
</template>
