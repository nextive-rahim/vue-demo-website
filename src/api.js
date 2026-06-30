// Base URL of the Laravel auth API. Defaults to a relative path so the Vite dev
// proxy (see vite.config.js) forwards it to the backend without CORS. Override
// with VITE_API_URL for a deployed build.
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'auth_token';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

/**
 * Error thrown for any non-2xx API response. Carries the HTTP status and the
 * Laravel validation `errors` bag so components can surface field-level messages.
 */
export class ApiError extends Error {
    constructor(status, data) {
        super(data?.message || 'Something went wrong.');
        this.status = status;
        this.errors = data?.errors || {};
        this.data = data || {};
    }

    /** First validation message for a given field, if any. */
    firstError(field) {
        return this.errors?.[field]?.[0] ?? null;
    }
}

async function request(method, path, body = null) {
    const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };

    const token = getToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    let data = {};
    try {
        data = await response.json();
    } catch {
        // Empty or non-JSON body — leave data as {}.
    }

    if (!response.ok) {
        throw new ApiError(response.status, data);
    }

    return data;
}

/**
 * POST a multipart/form-data body (file upload). The browser sets the
 * Content-Type (with boundary) automatically, so we must not set it here.
 */
async function upload(path, formData) {
    const headers = { Accept: 'application/json' };
    const token = getToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: formData });

    let data = {};
    try {
        data = await response.json();
    } catch {
        // Empty or non-JSON body.
    }

    if (!response.ok) {
        throw new ApiError(response.status, data);
    }

    return data;
}

export const api = {
    checkPhone: (phone) => request('POST', '/auth/check', { phone }),
    register: (payload) => request('POST', '/auth/register', payload),
    login: (payload) => request('POST', '/auth/login', payload),
    user: () => request('GET', '/auth/user'),
    logout: () => request('POST', '/auth/logout'),
    forgotPassword: (phone) => request('POST', '/auth/forgot-password', { phone }),
    resetPassword: (payload) => request('POST', '/auth/reset-password', payload),
    changePassword: (payload) => request('POST', '/auth/change-password', payload),

    // Avatar upload (multipart) to S3
    uploadAvatar: (file) => {
        const fd = new FormData();
        fd.append('avatar', file);
        return upload('/auth/avatar', fd);
    },
    removeAvatar: () => request('DELETE', '/auth/avatar'),

    // Public course catalog
    courses: () => request('GET', '/courses'),
    course: (id) => request('GET', `/courses/${id}`),
    // Step 3: load a single content item's data when it is clicked.
    courseContent: (courseId, contentId) => request('GET', `/courses/${courseId}/contents/${contentId}`),

    // Student exam player (auth required — Bearer token).
    getExam: (courseId, contentId) => request('GET', `/courses/${courseId}/contents/${contentId}/exam`),
    startExam: (courseId, contentId) => request('POST', `/courses/${courseId}/contents/${contentId}/exam/start`),
    submitExam: (courseId, contentId, answers) => request('POST', `/courses/${courseId}/contents/${contentId}/exam/submit`, { answers }),
    examResult: (courseId, contentId) => request('GET', `/courses/${courseId}/contents/${contentId}/exam/result`),
    examRanking: (courseId, contentId) => request('GET', `/courses/${courseId}/contents/${contentId}/exam/ranking`),
};
