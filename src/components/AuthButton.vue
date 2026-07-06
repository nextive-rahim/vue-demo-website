<script setup>
defineProps({
    loading: { type: Boolean, default: false },
    type: { type: String, default: 'submit' },
    variant: { type: String, default: 'primary' }, // 'primary' | 'ghost'
});

const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-60',
    ghost: 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:text-slate-900 hover:ring-slate-300',
};
</script>

<template>
    <button
        :type="type"
        :disabled="loading"
        class="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed"
        :class="variants[variant]"
    >
        <span v-if="variant === 'primary'" class="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full"></span>
        <svg v-if="loading" class="relative h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
        </svg>
        <span class="relative"><slot /></span>
    </button>
</template>
