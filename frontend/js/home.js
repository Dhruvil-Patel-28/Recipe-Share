// check if logged in
if (!getToken()) {
    window.location.href = 'login.html'
}

// fetch and display recipes
async function loadRecipes() {
    const response = await apiCall('/recipes/')
    const data = await response.json()

    const recipeList = document.getElementById('recipeList')
    recipeList.innerHTML = ''

    data.results ? data.results.forEach(displayRecipe) : data.forEach(displayRecipe)
}

function displayRecipe(recipe) {
    const recipeList = document.getElementById('recipeList')
    recipeList.innerHTML += `
        <div class="card">
            ${recipe.cover_image ? `<img src="${recipe.cover_image}" style="width:100%; height:200px; object-fit:cover; border-radius:8px; margin-bottom:15px"/>` : ''}
            <h2>${recipe.title}</h2>
            <p>${recipe.description}</p>
            <p>By: ${recipe.author} | ${recipe.cuisine} | ${recipe.difficulty}</p>
            <p>❤️ ${recipe.likes_count} likes</p>
            <a href="recipe.html?id=${recipe.id}">View Recipe →</a>
        </div>
    `
}

loadRecipes()