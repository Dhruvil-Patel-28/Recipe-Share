requireAuth()

async function loadProfile() {
    try {
        const response = await apiCall('/users/profile/')
        if (!response.ok) {
            showToast('Failed to load profile', 'error')
            return
        }
        const user = await response.json()

        const avatarUrl = user.profile_photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username) + '&background=f3efe9&color=6b6560&size=96'

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
            </div>
        `

        // Pre-fill edit form
        if (user.bio) {
            document.getElementById('bio').value = user.bio
        }
    } catch (err) {
        showToast('Error loading profile', 'error')
    }
}

async function loadMyRecipes() {
    const container = document.getElementById('myRecipes')
    renderRecipeSkeletons(container, 3)

    try {
        const response = await apiCall('/recipes/my_recipes/')
        const data = await response.json()

        const recipes = data.results || data
        container.innerHTML = ''

        if (recipes.length === 0) {
            renderEmptyState(container, '📝', 'You haven\'t created any recipes yet. <a href="create_recipe.html">Create one!</a>')
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
                                <span>❤ ${recipe.likes_count} likes</span>
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
        renderEmptyState(container, '⚠️', 'Could not load your recipes.')
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
loadMyRecipes()
