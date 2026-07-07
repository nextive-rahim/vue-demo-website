<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { api, ApiError } from '../api';
import AlertMessage from './AlertMessage.vue';
import AuthButton from './AuthButton.vue';

const props = defineProps({
    courseId: { type: [Number, String], required: true },
    contentId: { type: [Number, String], required: true },
});

// loading | intro | playing | result | error
const phase = ref('loading');
const error = ref(null);

const exam = ref(null); // meta from getExam
const attempt = ref(null);
const questions = ref([]); // from start (no is_correct)
const durationMinutes = ref(0);
const answers = ref({}); // { [questionId]: optionId | null }
const result = ref(null);

const starting = ref(false);
const submitting = ref(false);
const loadingResult = ref(false);

// Countdown timer.
const remainingSeconds = ref(0);
let deadline = null;
let ticker = null;

const answeredCount = computed(
    () => Object.values(answers.value).filter((v) => v !== null && v !== undefined).length,
);

const timerLabel = computed(() => formatClock(Math.max(0, remainingSeconds.value)));
const timerLow = computed(() => remainingSeconds.value <= 60);

const resultPercentage = computed(() => {
    if (!result.value || result.value.score === null || !result.value.total_marks) {
        return null;
    }
    return Math.round((result.value.score / result.value.total_marks) * 100);
});

// Pass mark + pass/fail come from the server (admin-set per exam; defaults to 40%).
const passMark = computed(() => result.value?.pass_mark ?? 40);
const passed = computed(() => {
    if (result.value?.passed !== null && result.value?.passed !== undefined) {
        return result.value.passed;
    }
    return resultPercentage.value !== null && resultPercentage.value >= passMark.value;
});

// Right / wrong / unanswered breakdown from the published review.
const analysis = computed(() => {
    const qs = result.value?.questions ?? [];
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    for (const q of qs) {
        if (q.your_option_id === null || q.your_option_id === undefined) {
            unanswered += 1;
        } else if (q.is_correct) {
            correct += 1;
        } else {
            wrong += 1;
        }
    }
    return { correct, wrong, unanswered, total: qs.length };
});

function formatClock(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(seconds) {
    if (seconds === null || seconds === undefined) {
        return '—';
    }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m} min ${s} sec` : `${s} sec`;
}

function formatDate(value) {
    if (!value) {
        return '';
    }
    return new Date(value).toLocaleString();
}

async function loadExam() {
    phase.value = 'loading';
    error.value = null;
    try {
        exam.value = (await api.getExam(props.courseId, props.contentId)).data;
        attempt.value = exam.value.attempt;

        // Always land on the intro/detail screen. A submitted attempt gets a
        // "View your result" action there instead of jumping straight to it.
        phase.value = 'intro';
    } catch (e) {
        error.value = e instanceof ApiError ? e.message : 'Could not load this exam.';
        phase.value = 'error';
    }
}

async function loadResult() {
    loadingResult.value = true;
    error.value = null;
    try {
        result.value = (await api.examResult(props.courseId, props.contentId)).data;
        phase.value = 'result';
    } catch (e) {
        error.value = e instanceof ApiError ? e.message : 'Could not load your result.';
        phase.value = 'error';
    } finally {
        loadingResult.value = false;
    }
}

async function start() {
    starting.value = true;
    error.value = null;
    try {
        const { data } = await api.startExam(props.courseId, props.contentId);
        attempt.value = data.attempt;
        questions.value = data.questions;
        durationMinutes.value = data.duration_minutes;

        // Seed an empty answer slot for every question.
        const seeded = {};
        for (const q of questions.value) {
            seeded[q.id] = null;
        }
        answers.value = seeded;

        beginTimer();
        phase.value = 'playing';
    } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
            // One-attempt rule: already submitted — fall back to the result.
            await loadResult();
        } else {
            error.value = e instanceof ApiError ? e.message : 'Could not start the exam.';
        }
    } finally {
        starting.value = false;
    }
}

function beginTimer() {
    // Anchor the deadline to the server's started_at so a resumed attempt keeps
    // counting from when it actually began, not from page load.
    const startedAt = attempt.value?.started_at ? new Date(attempt.value.started_at).getTime() : Date.now();
    deadline = startedAt + durationMinutes.value * 60 * 1000;
    tick();
    ticker = setInterval(tick, 1000);
}

function tick() {
    remainingSeconds.value = Math.round((deadline - Date.now()) / 1000);
    if (remainingSeconds.value <= 0) {
        remainingSeconds.value = 0;
        stopTimer();
        submit(true);
    }
}

function stopTimer() {
    if (ticker) {
        clearInterval(ticker);
        ticker = null;
    }
}

async function submit(auto = false) {
    if (submitting.value) {
        return;
    }
    if (!auto && answeredCount.value < questions.value.length) {
        const remaining = questions.value.length - answeredCount.value;
        if (!window.confirm(`${remaining} question(s) still unanswered. Submit anyway?`)) {
            return;
        }
    }

    submitting.value = true;
    error.value = null;
    stopTimer();

    const payload = questions.value.map((q) => ({
        question_id: q.id,
        question_option_id: answers.value[q.id] ?? null,
    }));

    try {
        result.value = (await api.submitExam(props.courseId, props.contentId, payload)).data;
        phase.value = 'result';
    } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
            await loadResult();
        } else {
            error.value = e instanceof ApiError ? e.message : 'Could not submit your answers.';
            phase.value = 'error';
        }
    } finally {
        submitting.value = false;
    }
}

function optionRowClass(question, option) {
    // Review highlighting on the result / practice screens.
    if (option.is_correct) {
        return 'border-emerald-300 bg-emerald-50 text-emerald-800';
    }
    if (option.id === question.your_option_id && !question.is_correct) {
        return 'border-red-300 bg-red-50 text-red-800';
    }
    return 'border-slate-200 text-slate-600';
}

// --- Result tabs: analysis (default) | ranking | practice -------------------
const resultTab = ref('analysis');

// Ranking (leaderboard) — fetched once, on demand.
const ranking = ref(null);
const rankingLoading = ref(false);
const rankingError = ref(null);

async function openRanking() {
    resultTab.value = 'ranking';
    if (ranking.value !== null) {
        return;
    }
    rankingLoading.value = true;
    rankingError.value = null;
    try {
        ranking.value = (await api.examRanking(props.courseId, props.contentId)).data;
    } catch (e) {
        rankingError.value = e instanceof ApiError ? e.message : 'Could not load the ranking.';
    } finally {
        rankingLoading.value = false;
    }
}

// Practice mode — re-take the exam and grade INSTANTLY on the client using the
// correct answers already present in the published result. Nothing is sent to
// the API and no real attempt is recorded.
const practicePhase = ref('taking'); // taking | done
const practiceAnswers = ref({});
const practiceResult = ref(null);

const practiceQuestions = computed(() => result.value?.questions ?? []);
const practiceAnsweredCount = computed(
    () => Object.values(practiceAnswers.value).filter((v) => v !== null && v !== undefined).length,
);

function openPractice() {
    resultTab.value = 'practice';
    resetPractice();
}

function resetPractice() {
    practicePhase.value = 'taking';
    practiceResult.value = null;
    const seeded = {};
    for (const q of practiceQuestions.value) {
        seeded[q.id] = null;
    }
    practiceAnswers.value = seeded;
}

function submitPractice() {
    let score = 0;
    let total = 0;
    const questions = practiceQuestions.value.map((q) => {
        total += q.marks;
        const chosenId = practiceAnswers.value[q.id] ?? null;
        const correctOption = q.options.find((o) => o.is_correct);
        const isCorrect = chosenId !== null && correctOption ? chosenId === correctOption.id : false;
        if (isCorrect) {
            score += q.marks;
        }
        return {
            id: q.id,
            body: q.body,
            marks: q.marks,
            options: q.options,
            your_option_id: chosenId,
            correct_option_id: correctOption?.id ?? null,
            is_correct: isCorrect,
        };
    });

    practiceResult.value = {
        score,
        total_marks: total,
        percentage: total ? Math.round((score / total) * 100) : 0,
        questions,
    };
    practicePhase.value = 'done';
}

onMounted(loadExam);
onBeforeUnmount(stopTimer);
</script>

<template>
    <div>
        <p v-if="phase === 'loading'" class="text-slate-400">Loading exam…</p>

        <AlertMessage v-if="error && phase === 'error'" type="error" :message="error" />

        <!-- INTRO / DETAIL: meta + start / resume -->
        <template v-if="phase === 'intro' && exam">
            <div class="space-y-5">
                <!-- Hero -->
                <div class="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-white shadow-xl shadow-indigo-500/25 sm:p-8">
                    <span class="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-inset ring-white/30">🎯 Exam</span>
                    <h3 class="mt-4 text-2xl font-black sm:text-3xl">{{ exam.title }}</h3>
                    <div class="mt-6 grid grid-cols-3 gap-3">
                        <div class="rounded-2xl bg-white/15 p-3 text-center ring-1 ring-inset ring-white/20">
                            <p class="text-xl font-black">{{ exam.duration_minutes || '—' }}</p>
                            <p class="text-[11px] font-medium uppercase tracking-wide text-white/80">Minutes</p>
                        </div>
                        <div class="rounded-2xl bg-white/15 p-3 text-center ring-1 ring-inset ring-white/20">
                            <p class="text-xl font-black">{{ exam.total_marks }}</p>
                            <p class="text-[11px] font-medium uppercase tracking-wide text-white/80">Marks</p>
                        </div>
                        <div class="rounded-2xl bg-white/15 p-3 text-center ring-1 ring-inset ring-white/20">
                            <p class="text-xl font-black">{{ exam.question_count }}</p>
                            <p class="text-[11px] font-medium uppercase tracking-wide text-white/80">Questions</p>
                        </div>
                    </div>
                    <p v-if="exam.pass_mark" class="mt-4 text-sm font-medium text-white/85">✅ Pass mark: {{ exam.pass_mark }}%</p>
                </div>

                <!-- Schedule -->
                <dl class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div v-if="exam.start_time" class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Opens</dt>
                        <dd class="mt-1 text-sm font-semibold text-slate-700">{{ formatDate(exam.start_time) }}</dd>
                    </div>
                    <div v-if="exam.end_time" class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Closes</dt>
                        <dd class="mt-1 text-sm font-semibold text-slate-700">{{ formatDate(exam.end_time) }}</dd>
                    </div>
                    <div v-if="exam.result_publish_time" class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Results</dt>
                        <dd class="mt-1 text-sm font-semibold text-slate-700">{{ formatDate(exam.result_publish_time) }}</dd>
                    </div>
                </dl>

                <div v-if="attempt && attempt.status === 'submitted'" class="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                    ✅ You've already submitted this exam. Open your result to see the analysis.
                </div>
                <div v-else class="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-500">
                    📋 One attempt only. The exam auto-submits when the timer runs out. Choose one answer per question.
                </div>

                <AlertMessage v-if="error" type="error" :message="error" />

                <!-- One attempt only: a submitted attempt leads to the result, never a re-take. -->
                <AuthButton v-if="attempt && attempt.status === 'submitted'" :loading="loadingResult" @click="loadResult">View your result →</AuthButton>

                <div v-else-if="!exam.is_open" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    This exam window is closed. You cannot take it right now.
                </div>

                <template v-else>
                    <AuthButton v-if="attempt && attempt.status === 'in_progress'" :loading="starting" @click="start">Resume exam →</AuthButton>
                    <AuthButton v-else :loading="starting" @click="start">Start exam →</AuthButton>
                </template>
            </div>
        </template>

        <!-- PLAYING: questions + timer -->
        <template v-else-if="phase === 'playing'">
            <div class="sticky top-0 z-10 -mx-5 mb-4 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-3 backdrop-blur">
                <span class="text-sm text-slate-500">{{ answeredCount }} / {{ questions.length }} answered</span>
                <span
                    class="rounded-md px-3 py-1 font-mono text-sm font-semibold"
                    :class="timerLow ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'"
                >⏱ {{ timerLabel }}</span>
            </div>

            <AlertMessage v-if="error" type="error" :message="error" class="mb-4" />

            <ol class="space-y-6">
                <li v-for="(question, index) in questions" :key="question.id" class="rounded-xl border border-slate-200 p-4">
                    <div class="flex items-start justify-between gap-3">
                        <p class="font-medium text-slate-900">
                            <span class="text-slate-400">{{ index + 1 }}.</span> {{ question.body }}
                        </p>
                        <span class="shrink-0 text-xs text-slate-400">{{ question.marks }} mark(s)</span>
                    </div>

                    <div class="mt-3 space-y-2">
                        <label
                            v-for="option in question.options"
                            :key="option.id"
                            class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition"
                            :class="answers[question.id] === option.id
                                ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'"
                        >
                            <input
                                v-model="answers[question.id]"
                                type="radio"
                                :name="`q-${question.id}`"
                                :value="option.id"
                                class="text-indigo-600"
                            />
                            <span>{{ option.body }}</span>
                        </label>
                    </div>
                </li>
            </ol>

            <div class="mt-6">
                <AuthButton :loading="submitting" @click="submit(false)">Submit exam</AuthButton>
            </div>
        </template>

        <!-- RESULT -->
        <template v-else-if="phase === 'result' && result">
            <div class="space-y-5">
                <h3 class="text-lg font-semibold text-slate-900">Your result</h3>

                <!-- Results withheld until publish time -->
                <div
                    v-if="!result.results_published"
                    class="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-4 text-sm text-indigo-700"
                >
                    <p class="font-semibold">Submitted ✓</p>
                    <p class="mt-1">
                        Your answers were recorded. Results are pending and will be published
                        <span v-if="result.result_publish_time" class="font-medium">on {{ formatDate(result.result_publish_time) }}</span>
                        <span v-else>soon</span>.
                    </p>
                    <p class="mt-2 text-indigo-500">Time taken: {{ formatDuration(result.attempt?.time_taken_seconds) }}</p>
                </div>

                <!-- Published result -->
                <template v-else>
                    <!-- Tabs: Analysis | Ranking | Practice -->
                    <div class="flex flex-wrap gap-2">
                        <button
                            class="rounded-lg px-4 py-2 text-sm font-medium transition"
                            :class="resultTab === 'analysis' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                            @click="resultTab = 'analysis'"
                        >📊 Analysis</button>
                        <button
                            class="rounded-lg px-4 py-2 text-sm font-medium transition"
                            :class="resultTab === 'ranking' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                            @click="openRanking"
                        >🏅 See ranking</button>
                        <button
                            class="rounded-lg px-4 py-2 text-sm font-medium transition"
                            :class="resultTab === 'practice' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                            @click="openPractice"
                        >🔁 Practice</button>
                    </div>

                    <!-- ANALYSIS -->
                    <template v-if="resultTab === 'analysis'">
                        <!-- Result hero: pass/fail + score + time -->
                        <div
                            class="overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-8"
                            :class="passed ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30' : 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/30'"
                        >
                            <div class="flex flex-wrap items-center justify-between gap-6">
                                <div>
                                    <span class="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-inset ring-white/30">
                                        {{ passed ? '🎉 Passed' : '❌ Failed' }}
                                    </span>
                                    <p class="mt-4 text-5xl font-black leading-none">{{ resultPercentage }}%</p>
                                    <p class="mt-2 text-sm text-white/85">{{ result.score }} / {{ result.total_marks }} marks · pass mark {{ passMark }}%</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-xs font-medium uppercase tracking-wide text-white/70">Time taken</p>
                                    <p class="text-2xl font-black">{{ formatDuration(result.attempt?.time_taken_seconds) }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Right / wrong / skipped -->
                        <div class="grid grid-cols-3 gap-3">
                            <div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                                <p class="text-3xl font-black text-emerald-600">{{ analysis.correct }}</p>
                                <p class="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-700">Right</p>
                            </div>
                            <div class="rounded-2xl border border-red-100 bg-red-50 p-4 text-center">
                                <p class="text-3xl font-black text-red-600">{{ analysis.wrong }}</p>
                                <p class="mt-1 text-xs font-bold uppercase tracking-wide text-red-700">Wrong</p>
                            </div>
                            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                                <p class="text-3xl font-black text-slate-500">{{ analysis.unanswered }}</p>
                                <p class="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Skipped</p>
                            </div>
                        </div>

                        <!-- Per-question review -->
                        <div v-if="result.questions" class="space-y-4">
                            <h4 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Review</h4>
                            <div v-for="(question, index) in result.questions" :key="question.id" class="rounded-xl border border-slate-200 p-4">
                                <div class="flex items-start justify-between gap-3">
                                    <p class="font-medium text-slate-900">
                                        <span class="text-slate-400">{{ index + 1 }}.</span> {{ question.body }}
                                    </p>
                                    <span
                                        class="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold"
                                        :class="question.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'"
                                    >{{ question.is_correct ? 'Correct' : 'Incorrect' }}</span>
                                </div>

                                <div class="mt-3 space-y-2">
                                    <div
                                        v-for="option in question.options"
                                        :key="option.id"
                                        class="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                                        :class="optionRowClass(question, option)"
                                    >
                                        <span>{{ option.body }}</span>
                                        <span class="shrink-0 text-xs font-medium">
                                            <span v-if="option.id === question.your_option_id">Your answer</span>
                                            <span v-if="option.is_correct" class="ml-2">✓ Correct</span>
                                        </span>
                                    </div>
                                    <p v-if="question.your_option_id === null" class="text-xs text-slate-400">You did not answer this question.</p>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- RANKING -->
                    <template v-else-if="resultTab === 'ranking'">
                        <h4 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Leaderboard</h4>
                        <p v-if="rankingLoading" class="text-sm text-slate-400">Loading ranking…</p>
                        <AlertMessage v-else-if="rankingError" type="error" :message="rankingError" />
                        <div v-else class="overflow-x-auto rounded-xl border border-slate-200">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                                    <tr>
                                        <th class="px-4 py-2">#</th>
                                        <th class="px-4 py-2">Name</th>
                                        <th class="px-4 py-2">Score</th>
                                        <th class="px-4 py-2">%</th>
                                        <th class="px-4 py-2">Time</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    <tr
                                        v-for="row in ranking"
                                        :key="row.rank"
                                        :class="row.is_you ? 'bg-indigo-50 font-semibold text-indigo-800' : 'text-slate-700'"
                                    >
                                        <td class="px-4 py-2">
                                            <span v-if="row.rank === 1">🥇</span>
                                            <span v-else-if="row.rank === 2">🥈</span>
                                            <span v-else-if="row.rank === 3">🥉</span>
                                            <span v-else>{{ row.rank }}</span>
                                        </td>
                                        <td class="px-4 py-2">{{ row.user_name }}<span v-if="row.is_you" class="ml-1 text-xs">(you)</span></td>
                                        <td class="px-4 py-2">{{ row.score }} / {{ row.total_marks }}</td>
                                        <td class="px-4 py-2">{{ row.percentage }}%</td>
                                        <td class="px-4 py-2">{{ formatDuration(row.time_taken_seconds) }}</td>
                                    </tr>
                                    <tr v-if="!ranking || !ranking.length"><td colspan="5" class="px-4 py-6 text-center text-slate-400">No submissions yet.</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </template>

                    <!-- PRACTICE (graded instantly on the client, no API call) -->
                    <template v-else>
                        <div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                            Practice mode — your real score above is unchanged. Answers are graded instantly in your browser.
                        </div>

                        <!-- Practice: taking -->
                        <template v-if="practicePhase === 'taking'">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-slate-500">{{ practiceAnsweredCount }} / {{ practiceQuestions.length }} answered</span>
                            </div>
                            <ol class="space-y-6">
                                <li v-for="(question, index) in practiceQuestions" :key="question.id" class="rounded-xl border border-slate-200 p-4">
                                    <div class="flex items-start justify-between gap-3">
                                        <p class="font-medium text-slate-900"><span class="text-slate-400">{{ index + 1 }}.</span> {{ question.body }}</p>
                                        <span class="shrink-0 text-xs text-slate-400">{{ question.marks }} mark(s)</span>
                                    </div>
                                    <div class="mt-3 space-y-2">
                                        <label
                                            v-for="option in question.options"
                                            :key="option.id"
                                            class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition"
                                            :class="practiceAnswers[question.id] === option.id ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'"
                                        >
                                            <input v-model="practiceAnswers[question.id]" type="radio" :name="`practice-${question.id}`" :value="option.id" class="text-indigo-600" />
                                            <span>{{ option.body }}</span>
                                        </label>
                                    </div>
                                </li>
                            </ol>
                            <AuthButton @click="submitPractice">Submit practice</AuthButton>
                        </template>

                        <!-- Practice: instant analysis -->
                        <template v-else>
                            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <div class="rounded-xl border border-slate-200 p-4">
                                    <p class="text-xs uppercase tracking-wide text-slate-400">Practice score</p>
                                    <p class="mt-1 text-2xl font-bold text-slate-900">{{ practiceResult.score }} <span class="text-base font-medium text-slate-400">/ {{ practiceResult.total_marks }}</span></p>
                                </div>
                                <div class="rounded-xl border border-slate-200 p-4">
                                    <p class="text-xs uppercase tracking-wide text-slate-400">Percentage</p>
                                    <p class="mt-1 text-2xl font-bold" :class="practiceResult.percentage >= 50 ? 'text-emerald-600' : 'text-red-600'">{{ practiceResult.percentage }}%</p>
                                </div>
                                <div class="flex items-center">
                                    <button class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700" @click="resetPractice">Practice again</button>
                                </div>
                            </div>

                            <div class="space-y-4">
                                <h4 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Review</h4>
                                <div v-for="(question, index) in practiceResult.questions" :key="question.id" class="rounded-xl border border-slate-200 p-4">
                                    <div class="flex items-start justify-between gap-3">
                                        <p class="font-medium text-slate-900"><span class="text-slate-400">{{ index + 1 }}.</span> {{ question.body }}</p>
                                        <span class="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold" :class="question.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">{{ question.is_correct ? 'Correct' : 'Incorrect' }}</span>
                                    </div>
                                    <div class="mt-3 space-y-2">
                                        <div
                                            v-for="option in question.options"
                                            :key="option.id"
                                            class="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                                            :class="optionRowClass(question, option)"
                                        >
                                            <span>{{ option.body }}</span>
                                            <span class="shrink-0 text-xs font-medium">
                                                <span v-if="option.id === question.your_option_id">Your answer</span>
                                                <span v-if="option.is_correct" class="ml-2">✓ Correct</span>
                                            </span>
                                        </div>
                                        <p v-if="question.your_option_id === null" class="text-xs text-slate-400">Not answered.</p>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </template>
                </template>
            </div>
        </template>
    </div>
</template>
