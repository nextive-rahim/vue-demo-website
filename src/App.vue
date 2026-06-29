<script setup>
import { onMounted, ref } from 'vue';
import { api, getToken, clearToken } from './api';
import SiteHeader from './components/SiteHeader.vue';
import HomeView from './components/HomeView.vue';
import CoursesView from './components/CoursesView.vue';
import CourseDetailView from './components/CourseDetailView.vue';
import PhoneStep from './components/PhoneStep.vue';
import PasswordStep from './components/PasswordStep.vue';
import SignupStep from './components/SignupStep.vue';
import ForgotStep from './components/ForgotStep.vue';
import ResetStep from './components/ResetStep.vue';
import DashboardView from './components/DashboardView.vue';
import AlertMessage from './components/AlertMessage.vue';

// loading | home | courses | courseDetail | phone | password | signup | forgot | reset | dashboard
const screen = ref('loading');
const phone = ref('');
const devCode = ref(null);
const user = ref(null);
const notice = ref(null);
const selectedCourseId = ref(null);

onMounted(async () => {
    if (!getToken()) {
        screen.value = 'home';
        return;
    }
    try {
        const { data } = await api.user();
        user.value = data;
    } catch {
        clearToken();
    }
    screen.value = 'home';
});

function navigate(action) {
    if (action === 'courses') {
        screen.value = 'courses';
    } else {
        screen.value = 'home';
    }
}

function openCourse(id) {
    selectedCourseId.value = id;
    screen.value = 'courseDetail';
}

function startAuth() {
    notice.value = null;
    screen.value = user.value ? 'dashboard' : 'phone';
}

function goToPassword(value) {
    phone.value = value;
    notice.value = null;
    screen.value = 'password';
}

function goToSignup(value) {
    phone.value = value;
    screen.value = 'signup';
}

function onAuthenticated(authUser) {
    user.value = authUser;
    notice.value = null;
    screen.value = 'dashboard';
}

function onCodeSent({ phone: value, devCode: code }) {
    phone.value = value;
    devCode.value = code;
    screen.value = 'reset';
}

function onPasswordReset() {
    devCode.value = null;
    notice.value = 'Password reset. You can now sign in with your new password.';
    screen.value = 'password';
}

function cancelAuth() {
    phone.value = '';
    devCode.value = null;
    notice.value = null;
    screen.value = 'home';
}

function onLogout() {
    user.value = null;
    cancelAuth();
}
</script>

<template>
    <div class="min-h-full">
        <div v-if="screen === 'loading'" class="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>

        <template v-else>
            <SiteHeader
                :user="user"
                :active="screen"
                @navigate="navigate"
                @login="startAuth"
                @account="screen = 'dashboard'"
            />

            <HomeView v-if="screen === 'home'" @open="openCourse" @browse="screen = 'courses'" @login="startAuth" />

            <CoursesView v-else-if="screen === 'courses'" @open="openCourse" @back="screen = 'home'" />

            <CourseDetailView v-else-if="screen === 'courseDetail'" :course-id="selectedCourseId" @back="screen = 'courses'" />

            <!-- Auth + account in a centered card -->
            <main v-else class="mx-auto flex max-w-md flex-col px-6 py-12">
                <AlertMessage v-if="notice" type="success" :message="notice" class="mb-6" />

                <div class="rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/60 ring-1 ring-slate-100">
                    <PhoneStep
                        v-if="screen === 'phone'"
                        :initial-phone="phone"
                        @found="goToPassword"
                        @new="goToSignup"
                    />
                    <PasswordStep
                        v-else-if="screen === 'password'"
                        :phone="phone"
                        @authenticated="onAuthenticated"
                        @forgot="screen = 'forgot'"
                        @back="cancelAuth"
                    />
                    <SignupStep
                        v-else-if="screen === 'signup'"
                        :phone="phone"
                        @authenticated="onAuthenticated"
                        @back="cancelAuth"
                    />
                    <ForgotStep
                        v-else-if="screen === 'forgot'"
                        :initial-phone="phone"
                        @sent="onCodeSent"
                        @back="screen = 'password'"
                    />
                    <ResetStep
                        v-else-if="screen === 'reset'"
                        :phone="phone"
                        :dev-code="devCode"
                        @done="onPasswordReset"
                        @back="screen = 'forgot'"
                    />
                    <DashboardView
                        v-else-if="screen === 'dashboard'"
                        :user="user"
                        @logout="onLogout"
                        @browse-courses="screen = 'courses'"
                        @user-updated="user = $event"
                    />
                </div>
            </main>
        </template>
    </div>
</template>
