if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault()

        const username = document.getElementById('username').value
        const password = document.getElementById('password').value

        const response = await apiCall('/token/', 'POST', { username, password })
        const data = await response.json()

        if (response.ok) {
            setToken(data.access)
            window.location.href = 'index.html'
        } else {
            alert('Invalid username or password')
        }
    })
}

if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault()

        const username = document.getElementById('username').value
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value

        const response = await apiCall('/users/register/', 'POST', { username, email, password })
        const data = await response.json()

        if (response.ok) {
            alert('Registration successful! Please login.')
            window.location.href = 'login.html'
        } else {
            alert(JSON.stringify(data))
        }
    })
}