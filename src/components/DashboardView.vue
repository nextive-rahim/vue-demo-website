<script setup>
import { ref } from 'vue';
import { api, ApiError, clearToken } from '../api';
import TextField from './TextField.vue';
import AlertMessage from './AlertMessage.vue';
import AuthButton from './AuthButton.vue';

const props = defineProps({
    user: { type: Object, required: true },
});

const emit = defineEmits(['logout', 'browse-courses', 'user-updated']);

const avatarInput = ref(null);
const uploadingAvatar = ref(false);
const avatarError = ref(null);

function pickAvatar() {
    avatarInput.value?.click();
}

async function onAvatarSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    uploadingAvatar.value = true;
    avatarError.value = null;
    try {
        const { user: updated } = await api.uploadAvatar(file);
        emit('user-updated', updated);
        success.value = 'Profile photo updated.';
    } catch (e) {
        avatarError.value = e instanceof ApiError ? (e.firstError('avatar') || e.message) : 'Upload failed.';
    } finally {
        uploadingAvatar.value = false;
        event.target.value = '';
    }
}

const showChangePassword = ref(false);
const form = ref({
    current_password: '',
    password: '',
    password_confirmation: '',
});
const errors = ref({});
const formError = ref(null);
const success = ref(null);
const loading = ref(false);
const loggingOut = ref(false);

async function changePassword() {
    loading.value = true;
    errors.value = {};
    formError.value = null;
    success.value = null;

    try {
        await api.changePassword(form.value);
        success.value = 'Your password has been changed.';
        form.value = { current_password: '', password: '', password_confirmation: '' };
        showChangePassword.value = false;
    } catch (e) {
        if (e instanceof ApiError) {
            errors.value = Object.fromEntries(
                Object.entries(e.errors).map(([field, messages]) => [field, messages[0]])
            );
            if (!Object.keys(e.errors).length) {
                formError.value = e.message;
            }
        } else {
            formError.value = 'Network error. Please try again.';
        }
    } finally {
        loading.value = false;
    }
}

async function logout() {
    loggingOut.value = true;
    try {
        await api.logout();
    } catch {
        // Even if the request fails, drop the local token.
    } finally {
        clearToken();
        emit('logout');
    }
}
</script>

<template>
    <div>
        <!-- Profile header -->
        <div class="flex items-center gap-4">
            <button type="button" class="group relative h-20 w-20 shrink-0" @click="pickAvatar">
                <span class="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 p-[3px]">
                    <img
                        v-if="user.avatar_url"
                        :src="user.avatar_url"
                        alt="Avatar"
                        class="h-full w-full rounded-full object-cover ring-2 ring-white"
                    />
                    <span
                        v-else
                        class="flex h-full w-full items-center justify-center rounded-full bg-white text-2xl font-black text-indigo-600"
                    >{{ (user.name || '?').charAt(0).toUpperCase() }}</span>
                </span>
                <span class="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-600 shadow ring-1 ring-slate-100 transition group-hover:text-indigo-600">
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke-linejoin="round" /><circle cx="12" cy="13" r="4" /></svg>
                </span>
                <span class="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/40 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                    {{ uploadingAvatar ? '…' : 'Change' }}
                </span>
            </button>
            <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-widest text-indigo-500">My account</p>
                <h1 class="truncate text-2xl font-black tracking-tight text-slate-900">{{ user.name }}</h1>
                <p class="text-sm text-slate-500">{{ user.phone }}</p>
            </div>
            <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarSelected" />
        </div>

        <AlertMessage v-if="avatarError" type="error" :message="avatarError" class="mt-4" />

        <dl class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Phone</dt>
                <dd class="mt-0.5 font-semibold text-slate-900">{{ user.phone }}</dd>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Email</dt>
                <dd class="mt-0.5 truncate font-semibold text-slate-900">{{ user.email || '—' }}</dd>
            </div>
        </dl>

        <AlertMessage v-if="success" type="success" :message="success" class="mt-6" />

        <div class="mt-6 space-y-4">
            <AuthButton type="button" @click="emit('browse-courses')">Browse courses</AuthButton>

            <AuthButton
                v-if="!showChangePassword"
                type="button"
                variant="ghost"
                @click="showChangePassword = true"
            >
                Change password
            </AuthButton>

            <form v-else class="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5" @submit.prevent="changePassword">
                <h2 class="font-bold text-slate-900">Change password</h2>
                <AlertMessage type="error" :message="formError" />
                <TextField
                    v-model="form.current_password"
                    label="Current password"
                    type="password"
                    autocomplete="current-password"
                    :error="errors.current_password"
                />
                <TextField
                    v-model="form.password"
                    label="New password"
                    type="password"
                    autocomplete="new-password"
                    :error="errors.password"
                />
                <TextField
                    v-model="form.password_confirmation"
                    label="Confirm new password"
                    type="password"
                    autocomplete="new-password"
                />
                <div class="flex gap-3">
                    <AuthButton :loading="loading">Save</AuthButton>
                    <AuthButton type="button" variant="ghost" @click="showChangePassword = false">Cancel</AuthButton>
                </div>
            </form>

            <AuthButton type="button" :loading="loggingOut" @click="logout">Log out</AuthButton>
        </div>
    </div>
</template>
