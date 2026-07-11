<script setup>
import { computed, ref } from 'vue';
import { api, ApiError } from '../api';
import AlertMessage from './AlertMessage.vue';

const props = defineProps({
    course: { type: Object, required: true },
});

const emit = defineEmits(['back', 'submitted']);

// bKash / Nagad / Rocket, with the merchant number students send payment to.
const methods = [
    { value: 'bkash', label: 'bKash', number: '01700-000000', color: 'text-pink-600', dot: 'bg-pink-500' },
    { value: 'nagad', label: 'Nagad', number: '01800-000000', color: 'text-orange-600', dot: 'bg-orange-500' },
    { value: 'rocket', label: 'Rocket', number: '01900-000000', color: 'text-purple-600', dot: 'bg-purple-500' },
];

const form = ref({
    payment_method: 'bkash',
    sender_number: '',
    receiver_number: methods[0].number,
    transaction_id: '',
});

const submitting = ref(false);
const error = ref(null);
const fieldErrors = ref({});

const selectedMethod = computed(() => methods.find((m) => m.value === form.value.payment_method) ?? methods[0]);
const price = computed(() => props.course.effective_price ?? props.course.price ?? 0);

// Prefill the receiver number with the merchant number for the chosen wallet.
function onMethodChange() {
    form.value.receiver_number = selectedMethod.value.number;
}

async function submit() {
    submitting.value = true;
    error.value = null;
    fieldErrors.value = {};
    try {
        const { data } = await api.enroll(props.course.id, { ...form.value });
        emit('submitted', data);
    } catch (e) {
        if (e instanceof ApiError) {
            error.value = e.message;
            fieldErrors.value = e.errors;
        } else {
            error.value = 'Something went wrong. Please try again.';
        }
    } finally {
        submitting.value = false;
    }
}
</script>

<template>
    <div class="animate-fade-up">
        <button class="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-indigo-600" @click="emit('back')">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
            Back to course
        </button>

        <h2 class="text-2xl font-black tracking-tight text-slate-900">Checkout</h2>
        <p class="mt-1 text-sm text-slate-500">Complete your mobile payment, then submit the transaction details below for review.</p>

        <div class="mt-6 grid gap-6 lg:grid-cols-5">
            <!-- Order summary -->
            <div class="lg:col-span-2">
                <div class="rounded-2xl border border-slate-200 bg-white p-5">
                    <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Order summary</p>
                    <p class="mt-3 font-bold text-slate-900">{{ course.title }}</p>
                    <div class="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4">
                        <span class="text-sm text-slate-500">Amount to pay</span>
                        <span class="text-2xl font-black text-slate-900">৳{{ price.toLocaleString() }}</span>
                    </div>
                </div>

                <div class="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 text-sm">
                    <p class="font-bold text-indigo-900">How to pay</p>
                    <ol class="mt-2 list-decimal space-y-1 pl-4 text-indigo-800/90">
                        <li>Open your <span class="font-semibold">{{ selectedMethod.label }}</span> app and choose <span class="font-semibold">Send Money</span>.</li>
                        <li>Send <span class="font-semibold">৳{{ price.toLocaleString() }}</span> to <span class="font-semibold">{{ selectedMethod.number }}</span>.</li>
                        <li>Enter the transaction ID (TrxID) below and submit.</li>
                    </ol>
                </div>
            </div>

            <!-- Payment form -->
            <form class="lg:col-span-3" @submit.prevent="submit">
                <div class="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
                    <AlertMessage type="error" :message="error" />

                    <div>
                        <label class="mb-1.5 block text-sm font-semibold text-slate-700">Payment method</label>
                        <div class="relative">
                            <select
                                v-model="form.payment_method"
                                class="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                @change="onMethodChange"
                            >
                                <option v-for="m in methods" :key="m.value" :value="m.value">{{ m.label }}</option>
                            </select>
                            <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
                        </div>
                        <p v-if="fieldErrors.payment_method" class="mt-1 text-xs text-red-600">{{ fieldErrors.payment_method[0] }}</p>
                    </div>

                    <div>
                        <label class="mb-1.5 block text-sm font-semibold text-slate-700">Receiver number (merchant)</label>
                        <input
                            v-model="form.receiver_number"
                            type="text"
                            inputmode="tel"
                            placeholder="01XXXXXXXXX"
                            class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                        <p v-if="fieldErrors.receiver_number" class="mt-1 text-xs text-red-600">{{ fieldErrors.receiver_number[0] }}</p>
                    </div>

                    <div>
                        <label class="mb-1.5 block text-sm font-semibold text-slate-700">Your sender number</label>
                        <input
                            v-model="form.sender_number"
                            type="text"
                            inputmode="tel"
                            placeholder="01XXXXXXXXX"
                            class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                        <p v-if="fieldErrors.sender_number" class="mt-1 text-xs text-red-600">{{ fieldErrors.sender_number[0] }}</p>
                    </div>

                    <div>
                        <label class="mb-1.5 block text-sm font-semibold text-slate-700">Transaction ID (TrxID)</label>
                        <input
                            v-model="form.transaction_id"
                            type="text"
                            placeholder="e.g. 9F2K7Q1XYZ"
                            class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm uppercase tracking-wide text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                        <p v-if="fieldErrors.transaction_id" class="mt-1 text-xs text-red-600">{{ fieldErrors.transaction_id[0] }}</p>
                    </div>

                    <button
                        type="submit"
                        class="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        :disabled="submitting"
                    >
                        {{ submitting ? 'Submitting…' : `Submit payment · ৳${price.toLocaleString()}` }}
                    </button>
                    <p class="text-center text-xs text-slate-400">Your access unlocks once an admin verifies the payment.</p>
                </div>
            </form>
        </div>
    </div>
</template>
