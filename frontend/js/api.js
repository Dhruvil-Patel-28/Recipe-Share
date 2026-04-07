const BASE_URL = 'http://127.0.0.1:8000/api'

function getToken() {
    return localStorage.getItem('token')
}

function setToken(token) {
    localStorage.setItem('token', token)
}

function removeToken() {
    localStorage.removeItem('token')
}

function logout() {
    removeToken()
    window.location.href = 'login.html'
}

async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
    }

    const token = getToken()
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const options = {
        method,
        headers,
    }

    if (body) {
        options.body = JSON.stringify(body)
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    return response
}