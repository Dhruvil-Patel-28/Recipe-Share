const urlParams = new URLSearchParams(window.location.search)
const recipeId = urlParams.get('id')

if (!recipeId) {
    document.getElementById('recipeDetail').innerHTML = 'Recipe not found. Missing recipe id in URL.'
}

async function loadRecipe() {
    const recipeDetail = document.getElementById('recipeDetail')
    recipeDetail.innerHTML = 'Loading...'

    if (!recipeId) {
        recipeDetail.innerHTML = 'Recipe not found. Missing recipe id in URL.'
        return
    }

    try {
        const response = await apiCall(`/recipes/${recipeId}/`)
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            recipeDetail.innerHTML = `Error loading recipe: ${response.status} ${response.statusText} ${errData.detail || ''}`
            return
        }

        const recipe = await response.json()
        const profileResponse = await apiCall('/users/profile/')

        if (!profileResponse.ok) {
            recipeDetail.innerHTML = 'Error loading user profile.'
            return
        }

        const user = await profileResponse.json()
        const isAuthor = user.username === recipe.author

        recipeDetail.innerHTML = `
            <div class="card">
                ${recipe.cover_image ? `<img src="${recipe.cover_image}" style="width:100%; height:300px; object-fit:cover; border-radius:8px; margin-bottom:15px"/>` : ''}
                <h1>${recipe.title}</h1>
                <p>${recipe.description}</p>
                <p>By: ${recipe.author} | ${recipe.cuisine} | ${recipe.difficulty}</p>
                <p>Prep: ${recipe.prep_time} mins | Cook: ${recipe.cook_time} mins</p>
                <p>❤️ ${recipe.likes_count} likes</p>
                <button class="like-btn" onclick="likeRecipe()">Like ❤️</button>
            </div>

            <div class="card">
                <h2>Ingredients</h2>
                <ul>
                    ${recipe.ingredients.map(i => `<li>${i.quantity} ${i.unit} ${i.name}</li>`).join('')}
                </ul>
                ${isAuthor ? `
                <br>
                <input type="text" id="ing_name" placeholder="Ingredient name" />
                <input type="number" id="ing_quantity" placeholder="Quantity" />
                <input type="text" id="ing_unit" placeholder="Unit (e.g. grams)" />
                <button onclick="addIngredient()">Add Ingredient</button>
                ` : ''}
            </div>

            <div class="card">
                <h2>Steps</h2>
                <ol>
                    ${recipe.steps.sort((a,b) => a.order - b.order).map(s => `<li>${s.instruction}</li>`).join('')}
                </ol>
                ${isAuthor ? `
                <br>
                <input type="number" id="step_order" placeholder="Step number" />
                <textarea id="step_instruction" placeholder="Instruction"></textarea>
                <button onclick="addStep()">Add Step</button>
                ` : ''}
            </div>
        `
    } catch (err) {
        recipeDetail.innerHTML = `Error loading recipe: ${err.message}`
    }
}

async function likeRecipe() {
    if (!recipeId) {
        alert('Cannot like: recipe not found')
        return
    }

    const response = await apiCall(`/recipes/${recipeId}/like/`, 'POST')
    if (response.ok) {
        loadRecipe()
    } else {
        const errData = await response.json().catch(() => ({}))
        alert('Like failed: ' + (errData.detail || response.status))
    }
}

async function addIngredient() {
    if (!recipeId) {
        alert('Cannot add ingredient: recipe not found')
        return
    }

    const data = {
        name: document.getElementById('ing_name').value,
        quantity: document.getElementById('ing_quantity').value,
        unit: document.getElementById('ing_unit').value,
    }
    const response = await apiCall(`/recipes/${recipeId}/add_ingredient/`, 'POST', data)
    if (response.ok) {
        alert('Ingredient added!')
        loadRecipe()
    } else {
        const errData = await response.json().catch(() => ({}))
        alert('Something went wrong: ' + (errData.detail || response.status))
    }
}

async function addStep() {
    if (!recipeId) {
        alert('Cannot add step: recipe not found')
        return
    }

    const data = {
        order: document.getElementById('step_order').value,
        instruction: document.getElementById('step_instruction').value,
    }
    const response = await apiCall(`/recipes/${recipeId}/add_step/`, 'POST', data)
    if (response.ok) {
        alert('Step added!')
        loadRecipe()
    } else {
        const errData = await response.json().catch(() => ({}))
        alert('Something went wrong: ' + (errData.detail || response.status))
    }
}

loadRecipe()