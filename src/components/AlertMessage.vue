<script setup>
defineProps({
    type: { type: String, default: 'error' }, // 'error' | 'success' | 'info'
    message: { type: String, default: '' },
});

const styles = {
    error: 'border-red-100 bg-red-50 text-red-700',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    info: 'border-indigo-100 bg-indigo-50 text-indigo-700',
};

const icons = {
    error: 'M12 8v5M12 16h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    success: 'M20 6 9 17l-5-5',
    info: 'M12 16v-5M12 8h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
};
</script>

<template>
    <div v-if="message" class="animate-fade-in flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ring-1 ring-inset ring-transparent" :class="styles[type]">
        <svg class="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path :d="icons[type]" />
        </svg>
        <span>{{ message }}</span>
    </div>
</template>
