if (!getToken()) {
    window.location.href = 'login.html'
}

async function loadProfile() {
    const response = await apiCall('/users/profile/')
    const user = await response.json()

    document.getElementById('profileDetail').innerHTML = `
        <div class="profile-header">
            <img src="${user.profile_photo || 'https://via.placeholder.com/100'}" width="100" height="100" style="border-radius:50%"/>
            <h1>${user.username}</h1>
            <p>${user.bio || 'No bio yet'}</p>
            <div class="profile-stats">
                <p>${user.followers_count}<br>Followers</p>
                <p>${user.following_count}<br>Following</p>
                <p>${user.recipes_count}<br>Recipes</p>
            </div>
        </div>
    `
}

async function loadMyRecipes() {
    const profileResponse = await apiCall('/users/profile/')
    const user = await profileResponse.json()
    
    const response = await apiCall('/recipes/')
    const data = await response.json()
    
    const myRecipes = document.getElementById('myRecipes')
    
    data.filter(recipe => recipe.author === user.username).forEach(recipe => {
        myRecipes.innerHTML += `
            <div class="card">
                <h3>${recipe.title}</h3>
                <a href="recipe.html?id=${recipe.id}">View</a>
            </div>
        `
    })
}

async function updateProfile() {
    const formData = new FormData()
    formData.append('bio', document.getElementById('bio').value)
    
    const photoFile = document.getElementById('profile_photo').files[0]
    if (photoFile) {
        formData.append('profile_photo', photoFile)
    }

    const response = await fetch(`${BASE_URL}/users/profile/update/`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${getToken()}`
        },
        body: formData
    })

    if (response.ok) {
        alert('Profile updated successfully!')
        loadProfile()
        document.getElementById('editForm').style.display = 'none'
    } else {
        alert('Something went wrong')
    }
}

loadProfile()
loadMyRecipes()