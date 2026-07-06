<script setup>
import { onMounted, ref } from 'vue';
import { api, getToken, clearToken } from './api';
import SiteHeader from './components/SiteHeader.vue';
import HomeView from './components/HomeView.vue';
import CoursesView from './components/CoursesView.vue';
import CourseDetailView from './components/CourseDetailView.vue';
import NoticesView from './components/NoticesView.vue';
import NoticeDetailView from './components/NoticeDetailView.vue';
import ReviewsView from './components/ReviewsView.vue';
import BlogView from './components/BlogView.vue';
import PostDetailView from './components/PostDetailView.vue';
import AboutView from './components/AboutView.vue';
import SiteFooter from './components/SiteFooter.vue';
import PhoneStep from './components/PhoneStep.vue';
import PasswordStep from './components/PasswordStep.vue';
import SignupStep from './components/SignupStep.vue';
import ForgotStep from './components/ForgotStep.vue';
import ResetStep from './components/ResetStep.vue';
import DashboardView from './components/DashboardView.vue';
import AlertMessage from './components/AlertMessage.vue';

// loading | home | courses | courseDetail | notices | noticeDetail | reviews | blog | postDetail | about | phone | password | signup | forgot | reset | dashboard
const screen = ref('loading');
const phone = ref('');
const devCode = ref(null);
const user = ref(null);
const notice = ref(null);
const selectedCourseId = ref(null);
const selectedNoticeId = ref(null);
const selectedPostId = ref(null);

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
    if (['courses', 'notices', 'reviews', 'blog', 'about'].includes(action)) {
        screen.value = action;
    } else {
        screen.value = 'home';
    }
}

function openCourse(id) {
    selectedCourseId.value = id;
    screen.value = 'courseDetail';
}

function openNotice(id) {
    selectedNoticeId.value = id;
    screen.value = 'noticeDetail';
}

function openPost(id) {
    selectedPostId.value = id;
    screen.value = 'postDetail';
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
        <div v-if="screen === 'loading'" class="flex min-h-screen flex-col items-center justify-center gap-4">
            <span class="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-black text-white shadow-lg shadow-indigo-500/30">D</span>
            <span class="text-sm font-medium text-slate-400">Loading…</span>
        </div>

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

            <CourseDetailView v-else-if="screen === 'courseDetail'" :course-id="selectedCourseId" :user="user" @back="screen = 'courses'" @login="startAuth" />

            <NoticesView v-else-if="screen === 'notices'" @open="openNotice" @back="screen = 'home'" />

            <NoticeDetailView v-else-if="screen === 'noticeDetail'" :notice-id="selectedNoticeId" @back="screen = 'notices'" />

            <ReviewsView v-else-if="screen === 'reviews'" @back="screen = 'home'" />

            <BlogView v-else-if="screen === 'blog'" @open="openPost" @back="screen = 'home'" />

            <PostDetailView v-else-if="screen === 'postDetail'" :post-id="selectedPostId" @back="screen = 'blog'" />

            <AboutView v-else-if="screen === 'about'" @back="screen = 'home'" @browse="screen = 'courses'" />

            <!-- Auth + account in a centered glass card on an ambient backdrop -->
            <main v-else class="relative isolate mx-auto flex min-h-[82vh] max-w-md flex-col justify-center px-6 py-12">
                <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div class="animate-blob absolute -left-24 top-10 h-72 w-72 bg-gradient-to-br from-indigo-300/40 to-blue-300/40 blur-3xl"></div>
                    <div class="animate-blob absolute -right-16 bottom-10 h-80 w-80 bg-gradient-to-br from-violet-300/40 to-fuchsia-300/40 blur-3xl" style="animation-delay: -6s"></div>
                </div>

                <AlertMessage v-if="notice" type="success" :message="notice" class="mb-6" />

                <div class="animate-scale-in rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl shadow-indigo-500/10 ring-1 ring-slate-100 backdrop-blur-xl">
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

            <SiteFooter
                v-if="['home', 'courses', 'courseDetail', 'notices', 'noticeDetail', 'reviews', 'blog', 'postDetail', 'about'].includes(screen)"
                @navigate="navigate"
            />
        </template>
    </div>
</template>
