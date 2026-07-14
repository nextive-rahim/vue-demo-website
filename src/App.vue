<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
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
import LiveCoursesView from './components/LiveCoursesView.vue';
import FreeResourcesView from './components/FreeResourcesView.vue';
import ProgramsView from './components/ProgramsView.vue';
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
const selectedProgramCategory = ref('all');
// The exam page and the checkout form are sub-pages of the course detail view.
// They live here (not inside it) so each one is a browser history entry of its own.
const selectedExamId = ref(null);
const checkingOut = ref(false);
// Where the current course/exam was opened from, so back navigation and the
// lit header tab return to the right place ('courses' or 'live').
const courseOrigin = ref('courses');

onMounted(async () => {
    if (getToken()) {
        try {
            const { data } = await api.user();
            user.value = data;
        } catch {
            clearToken();
        }
    }
    restoreNav();
});

/**
 * Restore the page (and scroll position) the user was on before a browser
 * refresh. Transient auth steps fall back to home; a saved dashboard only
 * restores when still logged in.
 */
function restoreNav() {
    let saved = null;
    try {
        saved = JSON.parse(sessionStorage.getItem(NAV_KEY) || 'null');
    } catch {
        saved = null;
    }

    let target = 'home';
    if (saved) {
        selectedCourseId.value = saved.courseId ?? null;
        selectedNoticeId.value = saved.noticeId ?? null;
        selectedPostId.value = saved.postId ?? null;
        selectedProgramCategory.value = saved.programCategory ?? 'all';
        courseOrigin.value = saved.courseOrigin ?? 'courses';

        const transient = ['loading', 'phone', 'password', 'signup', 'forgot', 'reset'];
        if (saved.screen === 'dashboard') {
            target = user.value ? 'dashboard' : 'home';
        } else if (saved.screen && !transient.includes(saved.screen)) {
            target = saved.screen;
        }
    }

    selectedExamId.value = saved?.examId ?? null;
    checkingOut.value = saved?.checkout ?? false;

    restoringScroll = true;
    // Restoring isn't a navigation: seed the entry we're already on rather than
    // pushing a new one, so the first Back leaves the site (as the user expects).
    applyingHistory = true;
    screen.value = target;
    nextTick(() => {
        applyingHistory = false;
        window.history.replaceState({ nav: navState.value, scrollY: saved?.scrollY || 0 }, '');
    });

    // Re-apply the saved scroll once the (async) content has had time to render.
    const y = saved?.scrollY || 0;
    let tries = 0;
    const applyScroll = () => {
        window.scrollTo(0, y);
        tries += 1;
        if (tries < 12 && Math.abs(window.scrollY - y) > 2) {
            setTimeout(applyScroll, 120);
        } else {
            restoringScroll = false;
        }
    };
    requestAnimationFrame(() => setTimeout(applyScroll, 80));
}

// Auth/account screens render in a card outside the cached marketing views.
const authScreens = ['phone', 'password', 'signup', 'forgot', 'reset', 'dashboard'];
const isAuthScreen = computed(() => authScreens.includes(screen.value));

// --- Keep the current page (and scroll) across a browser refresh. ---
const NAV_KEY = 'nav_state';
let restoringScroll = false;

/** Everything that identifies the page the user is looking at. */
const navState = computed(() => ({
    screen: screen.value,
    courseId: selectedCourseId.value,
    noticeId: selectedNoticeId.value,
    postId: selectedPostId.value,
    programCategory: selectedProgramCategory.value,
    courseOrigin: courseOrigin.value,
    examId: selectedExamId.value,
    checkout: checkingOut.value,
}));

function saveNav() {
    if (screen.value === 'loading') return;
    try {
        sessionStorage.setItem(NAV_KEY, JSON.stringify({ ...navState.value, scrollY: window.scrollY }));
    } catch {
        // Storage unavailable — ignore.
    }
}

window.addEventListener('beforeunload', saveNav);
if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
}

// --- Browser history -------------------------------------------------------
// The site has no router: screens are component state, so without this the Back
// button would leave the site entirely. Each navigation is mirrored into a
// History API entry (state only — the URL is untouched, since deep links would
// need server-side rewrites) which makes Back/Forward walk the app's own pages.

// True while we're applying a state the browser handed us, so the watcher below
// doesn't push that back onto the stack and trap the user in a loop.
let applyingHistory = false;

watch(navState, (nav, previous) => {
    if (applyingHistory || nav.screen === 'loading') return;

    if (replaceNextNav) {
        replaceNextNav = false;
        window.history.replaceState({ nav, scrollY: 0 }, '');
        saveNav();
        return;
    }

    // Runs before the DOM updates, so window.scrollY is still the outgoing
    // page's — stash it on its entry so Back returns to where the user was.
    window.history.replaceState({ nav: previous, scrollY: window.scrollY }, '');
    window.history.pushState({ nav, scrollY: 0 }, '');
    saveNav();
});

window.addEventListener('popstate', (event) => {
    const nav = event.state?.nav;
    if (!nav) return;

    applyingHistory = true;
    restoringScroll = true;
    applyNav(nav);

    const y = event.state.scrollY || 0;
    nextTick(() => {
        applyingHistory = false;
        window.scrollTo(0, y);
        // Cached views re-render synchronously, but a freshly-fetched one may
        // still be growing — re-apply once it has settled.
        setTimeout(() => {
            window.scrollTo(0, y);
            restoringScroll = false;
        }, 80);
        saveNav();
    });
});

/** Put the app back on the page described by a history entry. */
function applyNav(nav) {
    selectedCourseId.value = nav.courseId ?? null;
    selectedNoticeId.value = nav.noticeId ?? null;
    selectedPostId.value = nav.postId ?? null;
    selectedProgramCategory.value = nav.programCategory ?? 'all';
    courseOrigin.value = nav.courseOrigin ?? 'courses';
    selectedExamId.value = nav.examId ?? null;
    checkingOut.value = nav.checkout ?? false;
    // A stale entry can point at the dashboard after a logout.
    screen.value = nav.screen === 'dashboard' && !user.value ? 'home' : (nav.screen ?? 'home');
}

// Scroll to the top on user navigation — but not while restoring a saved position.
watch(navState, () => {
    if (restoringScroll) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
});

function navigate(action) {
    if (['courses', 'notices', 'reviews', 'blog', 'about', 'live', 'free', 'programs'].includes(action)) {
        if (action === 'programs') selectedProgramCategory.value = 'all';
        screen.value = action;
    } else {
        screen.value = 'home';
    }
}

function openPrograms(category) {
    selectedProgramCategory.value = category || 'all';
    screen.value = 'programs';
}

function openCourse(id, origin = 'courses') {
    selectedCourseId.value = id;
    selectedExamId.value = null;
    checkingOut.value = false;
    courseOrigin.value = origin;
    screen.value = 'courseDetail';
}

/** Open a course straight into a specific exam's detail page. */
function openExam({ courseId, contentId }) {
    selectedCourseId.value = courseId;
    selectedExamId.value = contentId;
    checkingOut.value = false;
    courseOrigin.value = 'live';
    screen.value = 'courseDetail';
}

/**
 * The course detail view's own sub-pages. They're driven from here so each gets
 * its own history entry and the Back button steps exam → lesson list → catalog.
 */
function openExamContent(contentId) {
    selectedExamId.value = contentId;
}

// After a payment is submitted the form is gone for good, so replace its history
// entry rather than pushing — Back should never land on a submitted form.
let replaceNextNav = false;

function onEnrolled() {
    replaceNextNav = true;
    checkingOut.value = false;
}

// The course detail screen belongs to whichever tab it was opened from, so the
// header keeps that tab lit instead of always falling back to Courses.
const headerActive = computed(() =>
    (screen.value === 'courseDetail' && courseOrigin.value === 'live') ? 'live' : screen.value,
);

/** Human label for the course detail's top back link. */
const courseBackLabel = computed(() => (courseOrigin.value === 'live' ? "Today's Live" : 'All courses'));

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
                :active="headerActive"
                @navigate="navigate"
                @login="startAuth"
                @account="screen = 'dashboard'"
            />

            <!-- Marketing views cached so switching pages is instant and doesn't re-fetch the API. -->
            <KeepAlive :max="12">
            <HomeView v-if="screen === 'home'" @open="openCourse" @browse="screen = 'courses'" @login="startAuth" @programs="openPrograms" />

            <CoursesView v-else-if="screen === 'courses'" @open="openCourse" @back="screen = 'home'" />

            <CourseDetailView
                v-else-if="screen === 'courseDetail'"
                :course-id="selectedCourseId"
                :initial-exam-id="selectedExamId"
                :checkout="checkingOut"
                :user="user"
                :back-label="courseBackLabel"
                @back="screen = courseOrigin"
                @login="startAuth"
                @open-exam="openExamContent"
                @close-exam="selectedExamId = null"
                @open-checkout="checkingOut = true"
                @close-checkout="checkingOut = false"
                @enrolled="onEnrolled"
            />

            <NoticesView v-else-if="screen === 'notices'" @open="openNotice" @back="screen = 'home'" />

            <NoticeDetailView v-else-if="screen === 'noticeDetail'" :notice-id="selectedNoticeId" @back="screen = 'notices'" />

            <ReviewsView v-else-if="screen === 'reviews'" @back="screen = 'home'" />

            <BlogView v-else-if="screen === 'blog'" @open="openPost" @back="screen = 'home'" />

            <PostDetailView v-else-if="screen === 'postDetail'" :post-id="selectedPostId" @back="screen = 'blog'" />

            <AboutView v-else-if="screen === 'about'" @back="screen = 'home'" @browse="screen = 'courses'" />

            <LiveCoursesView v-else-if="screen === 'live'" @back="screen = 'home'" @open="openCourse($event, 'live')" @open-exam="openExam" />

            <FreeResourcesView v-else-if="screen === 'free'" @back="screen = 'home'" />

            <ProgramsView v-else-if="screen === 'programs'" :initial-category="selectedProgramCategory" @back="screen = 'home'" />
            </KeepAlive>

            <!-- Auth + account in a centered glass card on an ambient backdrop -->
            <main v-if="isAuthScreen" class="relative isolate mx-auto flex min-h-[82vh] max-w-md flex-col justify-center px-6 py-12">
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
                v-if="['home', 'courses', 'courseDetail', 'notices', 'noticeDetail', 'reviews', 'blog', 'postDetail', 'about', 'live', 'free', 'programs'].includes(screen)"
                @navigate="navigate"
            />
        </template>
    </div>
</template>
