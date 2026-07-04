// ---- Login Form ----
if (document.getElementById('loginForm')) {
    const form = document.getElementById('loginForm')
    const btn = document.getElementById('loginBtn')

    form.addEventListener('submit', async function(e) {
        e.preventDefault()
        clearErrors()

        const username = document.getElementById('username').value.trim()
        const password = document.getElementById('password').value

        // Basic validation
        let hasError = false
        if (!username) {
            showFieldError('username', 'Username is required')
            hasError = true
        }
        if (!password) {
            showFieldError('password', 'Password is required')
            hasError = true
        }
        if (hasError) return

        btn.disabled = true
        btn.textContent = 'Logging in...'

        try {
            const response = await apiCall('/token/', 'POST', { username, password })
            const data = await response.json()

            if (response.ok) {
                setToken(data.access)
                if (data.refresh) setRefreshToken(data.refresh)
                window.location.href = 'index.html'
            } else {
                showFieldError('password', 'Invalid username or password')
            }
        } catch (err) {
            showFieldError('password', 'Network error. Please try again.')
        } finally {
            btn.disabled = false
            btn.textContent = 'Log In'
        }
    })
}

// ---- Register Form ----
if (document.getElementById('registerForm')) {
    const form = document.getElementById('registerForm')
    const btn = document.getElementById('registerBtn')

    form.addEventListener('submit', async function(e) {
        e.preventDefault()
        clearErrors()

        const username = document.getElementById('username').value.trim()
        const email = document.getElementById('email').value.trim()
        const password = document.getElementById('password').value

        // Basic validation
        let hasError = false
        if (!username) {
            showFieldError('username', 'Username is required')
            hasError = true
        }
        if (!email) {
            showFieldError('email', 'Email is required')
            hasError = true
        }
        if (!password || password.length < 8) {
            showFieldError('password', 'Password must be at least 8 characters')
            hasError = true
        }
        if (hasError) return

        btn.disabled = true
        btn.textContent = 'Creating account...'

        try {
            const response = await apiCall('/users/register/', 'POST', { username, email, password })
            const data = await response.json()

            if (response.ok) {
                showToast('Account created! Redirecting to login...', 'success')
                setTimeout(() => {
                    window.location.href = 'login.html'
                }, 1500)
            } else {
                // Show server validation errors inline
                if (data.username) showFieldError('username', data.username[0])
                if (data.email) showFieldError('email', data.email[0])
                if (data.password) showFieldError('password', data.password[0])

                // If no specific field errors, show generic
                if (!data.username && !data.email && !data.password) {
                    showToast('Registration failed. Please try again.', 'error')
                }
            }
        } catch (err) {
            showToast('Network error. Please try again.', 'error')
        } finally {
            btn.disabled = false
            btn.textContent = 'Create Account'
        }
    })
}

// ---- Form Error Helpers ----
function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId)
    const errorEl = document.getElementById(fieldId + 'Error')
    if (input) input.classList.add('form-input-error')
    if (errorEl) errorEl.textContent = message
}

function clearErrors() {
    document.querySelectorAll('.form-input-error').forEach(el => el.classList.remove('form-input-error'))
    document.querySelectorAll('.form-error-text').forEach(el => el.textContent = '')
}
