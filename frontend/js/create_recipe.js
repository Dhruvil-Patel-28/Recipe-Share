if (!getToken()) {
    window.location.href = 'login.html'
}

document.getElementById('createRecipeForm').addEventListener('submit', async function(e) {
    e.preventDefault()

    const formData = new FormData()
    formData.append('title', document.getElementById('title').value)
    formData.append('description', document.getElementById('description').value)
    formData.append('prep_time', document.getElementById('prep_time').value)
    formData.append('cook_time', document.getElementById('cook_time').value)
    formData.append('difficulty', document.getElementById('difficulty').value)
    formData.append('cuisine', document.getElementById('cuisine').value)
    formData.append('is_published', document.getElementById('is_published').checked)
    
    const imageFile = document.getElementById('cover_image').files[0]
    if (imageFile) {
        formData.append('cover_image', imageFile)
    }

    const response = await fetch(`${BASE_URL}/recipes/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`
        },
        body: formData
    })

    const data = await response.json()

    if (response.ok) {
        alert('Recipe created successfully!')
        window.location.href = `recipe.html?id=${data.id}`
    } else {
        alert(JSON.stringify(data))
    }
})