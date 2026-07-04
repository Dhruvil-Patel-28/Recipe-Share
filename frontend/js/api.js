const BASE_URL = 'http://127.0.0.1:8000/api'

// ---- Token helpers ----
function getToken() {
    return localStorage.getItem('token')
}

function setToken(token) {
    localStorage.setItem('token', token)
}

function setRefreshToken(token) {
    localStorage.setItem('refresh_token', token)
}

function getRefreshToken() {
    return localStorage.getItem('refresh_token')
}

function removeToken() {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
}

function logout() {
    removeToken()
    window.location.href = 'login.html'
}

function requireAuth() {
    if (!getToken()) {
        window.location.href = 'login.html'
    }
}

// ---- API call (JSON) ----
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
    }

    const token = getToken()
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const options = { method, headers }

    if (body) {
        options.body = JSON.stringify(body)
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    return response
}

// ---- API call (FormData — for file uploads) ----
async function apiCallFormData(endpoint, method, formData) {
    const headers = {}

    const token = getToken()
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: formData
    })
    return response
}

// ---- Toast Notification System ----
function ensureToastContainer() {
    let container = document.querySelector('.toast-container')
    if (!container) {
        container = document.createElement('div')
        container.className = 'toast-container'
        document.body.appendChild(container)
    }
    return container
}

function showToast(message, type = 'info', duration = 3000) {
    const container = ensureToastContainer()

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    }

    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`
    container.appendChild(toast)

    setTimeout(() => {
        toast.classList.add('toast-out')
        toast.addEventListener('animationend', () => toast.remove())
    }, duration)
}

// ---- Loading Skeletons ----
function renderRecipeSkeletons(container, count = 6) {
    container.innerHTML = ''
    for (let i = 0; i < count; i++) {
        container.innerHTML += `
            <div class="skeleton-card">
                <div class="skeleton skeleton-img"></div>
                <div class="skeleton-body">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text-short"></div>
                </div>
            </div>
        `
    }
}

// ---- Empty State ----
function renderEmptyState(container, icon, message) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">${icon}</div>
            <p>${message}</p>
        </div>
    `
}
