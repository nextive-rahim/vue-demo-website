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
        <div class="flex items-center gap-4">
            <button type="button" class="group relative h-16 w-16 shrink-0" @click="pickAvatar">
                <img
                    v-if="user.avatar_url"
                    :src="user.avatar_url"
                    alt="Avatar"
                    class="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100"
                />
                <span
                    v-else
                    class="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600"
                >{{ (user.name || '?').charAt(0).toUpperCase() }}</span>
                <span class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                    {{ uploadingAvatar ? '…' : 'Change' }}
                </span>
            </button>
            <div>
                <h1 class="text-xl font-bold text-slate-900">{{ user.name }}</h1>
                <p class="text-sm text-slate-500">{{ user.phone }}</p>
                <button type="button" class="mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-500" @click="pickAvatar">
                    {{ uploadingAvatar ? 'Uploading…' : 'Upload photo' }}
                </button>
            </div>
            <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarSelected" />
        </div>

        <AlertMessage v-if="avatarError" type="error" :message="avatarError" class="mt-4" />

        <dl class="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
            <div class="flex justify-between px-4 py-3">
                <dt class="text-slate-500">Phone</dt>
                <dd class="font-medium text-slate-900">{{ user.phone }}</dd>
            </div>
            <div class="flex justify-between px-4 py-3">
                <dt class="text-slate-500">Email</dt>
                <dd class="font-medium text-slate-900">{{ user.email || '—' }}</dd>
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

            <form v-else class="space-y-4 rounded-xl border border-slate-200 p-4" @submit.prevent="changePassword">
                <h2 class="font-semibold text-slate-900">Change password</h2>
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
