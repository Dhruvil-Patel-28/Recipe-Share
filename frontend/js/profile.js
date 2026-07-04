const urlParams = new URLSearchParams(window.location.search)
const profileId = urlParams.get('id')

// Only require auth if viewing your own profile
if (!profileId) {
    requireAuth()
}

async function loadProfile() {
    try {
        const endpoint = profileId ? `/users/profile/${profileId}/` : '/users/profile/'
        const response = await apiCall(endpoint)
        if (!response.ok) {
            showToast('Failed to load profile', 'error')
            return
        }
        const user = await response.json()

        const avatarUrl = user.profile_photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username) + '&background=f3efe9&color=6b6560&size=96'

        let actionButtonHtml = ''
        if (!profileId) {
            actionButtonHtml = `<button class="btn btn-secondary" onclick="toggleEditForm()">Edit Profile</button>`
        } else if (getToken()) {
            // Assume we don't know if we're following yet since the API doesn't return it directly on the profile model right now
            // But we can just show Follow/Unfollow toggle
            actionButtonHtml = `<button class="btn btn-primary" onclick="followUser(${user.id})">Follow / Unfollow</button>`
        }

        document.getElementById('profileDetail').innerHTML = `
            <div class="profile-header">
                <img class="profile-avatar" src="${avatarUrl}" alt="${user.username}" />
                <h1>${user.username}</h1>
                <p class="profile-bio">${user.bio || 'No bio yet'}</p>
                <div class="profile-stats">
                    <div class="profile-stat">
                        <span class="number">${user.recipes_count}</span>
                        <span class="label">Recipes</span>
                    </div>
                    <div class="profile-stat">
                        <span class="number">${user.followers_count}</span>
                        <span class="label">Followers</span>
                    </div>
                    <div class="profile-stat">
                        <span class="number">${user.following_count}</span>
                        <span class="label">Following</span>
                    </div>
                </div>
                <div style="margin-top:20px">${actionButtonHtml}</div>
            </div>
        `

        // Pre-fill edit form if editing own profile
        if (!profileId && user.bio) {
            document.getElementById('bio').value = user.bio
        }
    } catch (err) {
        showToast('Error loading profile', 'error')
    }
}

async function followUser(userId) {
    const response = await apiCall(`/users/follow/${userId}/`, 'POST')
    if (response.ok) {
        const data = await response.json()
        showToast(data.message, 'success')
        loadProfile()
    } else {
        showToast('Failed to follow user', 'error')
    }
}

async function loadRecipes() {
    const container = document.getElementById('myRecipes')
    renderRecipeSkeletons(container, 3)

    try {
        const endpoint = profileId ? `/recipes/?author=${profileId}` : '/recipes/my_recipes/'
        const response = await apiCall(endpoint)
        const data = await response.json()

        const recipes = data.results || data
        container.innerHTML = ''

        if (recipes.length === 0) {
            renderEmptyState(container, '📝', profileId ? 'This user has no recipes.' : 'You haven\'t created any recipes yet. <a href="create_recipe.html">Create one!</a>')
            return
        }

        recipes.forEach(recipe => {
            const imgHtml = recipe.cover_image
                ? `<img class="recipe-card-img" src="${recipe.cover_image}" alt="${recipe.title}" />`
                : `<div class="recipe-card-img-placeholder">🍽️</div>`

            const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)

            container.innerHTML += `
                <div class="recipe-card">
                    <a href="recipe.html?id=${recipe.id}">${imgHtml}</a>
                    <div class="recipe-card-body">
                        <h3><a href="recipe.html?id=${recipe.id}">${recipe.title}</a></h3>
                            <div class="recipe-card-meta">
                                <span>⏱ ${totalTime} min</span>
                                <span>👨‍🍳 ${recipe.difficulty}</span>
                                <span>${recipe.is_liked ? '❤️' : '♡'} ${recipe.likes_count} likes</span>
                            </div>
                        <p class="recipe-card-desc">${recipe.description || ''}</p>
                        <div class="recipe-card-footer">
                            <span class="author">${recipe.is_published ? 'Published' : 'Draft'}</span>
                            <a href="recipe.html?id=${recipe.id}" style="font-size:0.85rem;font-weight:500">View →</a>
                        </div>
                    </div>
                </div>
            `
        })
    } catch (err) {
        container.innerHTML = ''
        renderEmptyState(container, '⚠️', 'Could not load recipes.')
    }
}

function toggleEditForm() {
    const form = document.getElementById('editForm')
    form.classList.toggle('visible')
}

async function updateProfile() {
    const formData = new FormData()
    const bio = document.getElementById('bio').value.trim()
    formData.append('bio', bio)

    const photoFile = document.getElementById('profile_photo').files[0]
    if (photoFile) {
        formData.append('profile_photo', photoFile)
    }

    try {
        const response = await apiCallFormData('/users/profile/update/', 'PATCH', formData)

        if (response.ok) {
            showToast('Profile updated', 'success')
            toggleEditForm()
            loadProfile()
        } else {
            showToast('Failed to update profile', 'error')
        }
    } catch (err) {
        showToast('Network error', 'error')
    }
}

loadProfile()
loadRecipes()
