const urlParams = new URLSearchParams(window.location.search)
const recipeId = urlParams.get('id')
let currentUser = null
let isAuthor = false

if (!recipeId) {
    document.getElementById('recipeDetail').innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>Recipe not found. <a href="index.html">Browse recipes</a></p>
        </div>
    `
}

async function loadRecipe() {
    if (!recipeId) return
    const recipeDetail = document.getElementById('recipeDetail')

    try {
        const response = await apiCall(`/recipes/${recipeId}/`)
        if (!response.ok) {
            recipeDetail.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">😕</div>
                    <p>Could not load this recipe. It may have been removed.</p>
                </div>
            `
            return
        }

        const recipe = await response.json()

        // Try to get current user (may fail if not logged in)
        try {
            const profileResponse = await apiCall('/users/profile/')
            if (profileResponse.ok) {
                currentUser = await profileResponse.json()
                isAuthor = currentUser.username === recipe.author
            }
        } catch (e) {
            // Not logged in, that's fine
        }

        document.title = `${recipe.title} — RecipeShare`

        const heroHtml = recipe.cover_image
            ? `<div class="recipe-hero"><img src="${recipe.cover_image}" alt="${recipe.title}" /></div>`
            : `<div class="recipe-hero-placeholder">🍽️</div>`

        const ingredientsHtml = recipe.ingredients.length > 0
            ? recipe.ingredients.map(i => `
                <li>
                    <span><span class="ingredient-qty">${i.quantity} ${i.unit}</span> ${i.name}</span>
                    ${isAuthor ? `<button class="btn-danger" onclick="deleteIngredient(${i.id})">Remove</button>` : ''}
                </li>
            `).join('')
            : '<li style="color:var(--color-text-muted)">No ingredients added yet.</li>'

        const stepsHtml = recipe.steps.length > 0
            ? recipe.steps
                .sort((a, b) => a.order - b.order)
                .map(s => `
                    <li>
                        <div class="step-content">
                            <span>${s.instruction}</span>
                            ${isAuthor ? `<button class="btn-danger" onclick="deleteStep(${s.id})">Remove</button>` : ''}
                        </div>
                    </li>
                `).join('')
            : '<li style="color:var(--color-text-muted)">No steps added yet.</li>'

        recipeDetail.innerHTML = `
            ${heroHtml}

            <div class="recipe-title-section">
                <h1>${recipe.title}</h1>
                <p class="recipe-desc">${recipe.description}</p>
            </div>

            <div class="recipe-info-bar">
                <div class="recipe-info-item">
                    <div class="label">Prep Time</div>
                    <div class="value">${recipe.prep_time} min</div>
                </div>
                <div class="recipe-info-item">
                    <div class="label">Cook Time</div>
                    <div class="value">${recipe.cook_time} min</div>
                </div>
                <div class="recipe-info-item">
                    <div class="label">Total</div>
                    <div class="value">${(recipe.prep_time || 0) + (recipe.cook_time || 0)} min</div>
                </div>
                <div class="recipe-info-item">
                    <div class="label">Difficulty</div>
                    <div class="value">${recipe.difficulty}</div>
                </div>
                <div class="recipe-info-item">
                    <div class="label">Cuisine</div>
                    <div class="value">${recipe.cuisine}</div>
                </div>
                <div class="recipe-info-item">
                    <div class="label">Author</div>
                    <div class="value">${recipe.author}</div>
                </div>
            </div>

            <div class="recipe-actions">
                <button class="btn-like" id="likeBtn" onclick="likeRecipe()">
                    ❤ ${recipe.likes_count} likes
                </button>
            </div>

            <div class="card">
                <h2>Ingredients</h2>
                <ul class="ingredient-list">${ingredientsHtml}</ul>
                ${isAuthor ? `
                <div class="inline-add-form">
                    <input type="text" class="form-input" id="ing_name" placeholder="Name" />
                    <input type="number" class="form-input" id="ing_quantity" placeholder="Qty" style="max-width:80px" step="any" />
                    <input type="text" class="form-input" id="ing_unit" placeholder="Unit" style="max-width:100px" />
                    <button class="btn btn-secondary btn-sm" onclick="addIngredient()">Add</button>
                </div>` : ''}
            </div>

            <div class="card">
                <h2>Steps</h2>
                <ol class="steps-list">${stepsHtml}</ol>
                ${isAuthor ? `
                <div class="inline-add-form">
                    <input type="number" class="form-input" id="step_order" placeholder="#" style="max-width:60px" />
                    <input type="text" class="form-input" id="step_instruction" placeholder="Describe this step..." />
                    <button class="btn btn-secondary btn-sm" onclick="addStep()">Add</button>
                </div>` : ''}
            </div>
        `
    } catch (err) {
        recipeDetail.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>Error loading recipe: ${err.message}</p>
            </div>
        `
    }
}

async function likeRecipe() {
    if (!recipeId) return
    if (!getToken()) {
        showToast('Please log in to like recipes', 'info')
        return
    }

    try {
        const response = await apiCall(`/recipes/${recipeId}/like/`, 'POST')
        if (response.ok) {
            const data = await response.json()
            showToast(data.message, 'success')
            loadRecipe()
        } else {
            showToast('Could not like this recipe', 'error')
        }
    } catch (err) {
        showToast('Network error', 'error')
    }
}

async function addIngredient() {
    if (!recipeId) return
    const data = {
        name: document.getElementById('ing_name').value.trim(),
        quantity: document.getElementById('ing_quantity').value,
        unit: document.getElementById('ing_unit').value.trim(),
    }

    if (!data.name || !data.quantity) {
        showToast('Please enter ingredient name and quantity', 'info')
        return
    }

    const response = await apiCall(`/recipes/${recipeId}/add_ingredient/`, 'POST', data)
    if (response.ok) {
        showToast('Ingredient added', 'success')
        loadRecipe()
    } else {
        const err = await response.json().catch(() => ({}))
        showToast(err.error || 'Failed to add ingredient', 'error')
    }
}

async function addStep() {
    if (!recipeId) return
    const data = {
        order: document.getElementById('step_order').value,
        instruction: document.getElementById('step_instruction').value.trim(),
    }

    if (!data.instruction || !data.order) {
        showToast('Please enter step number and instruction', 'info')
        return
    }

    const response = await apiCall(`/recipes/${recipeId}/add_step/`, 'POST', data)
    if (response.ok) {
        showToast('Step added', 'success')
        loadRecipe()
    } else {
        const err = await response.json().catch(() => ({}))
        showToast(err.error || 'Failed to add step', 'error')
    }
}

async function deleteIngredient(ingredientId) {
    const response = await apiCall(`/recipes/${recipeId}/delete_ingredient/`, 'POST', { ingredient_id: ingredientId })
    if (response.ok) {
        showToast('Ingredient removed', 'success')
        loadRecipe()
    } else {
        showToast('Failed to remove ingredient', 'error')
    }
}

async function deleteStep(stepId) {
    const response = await apiCall(`/recipes/${recipeId}/delete_step/`, 'POST', { step_id: stepId })
    if (response.ok) {
        showToast('Step removed', 'success')
        loadRecipe()
    } else {
        showToast('Failed to remove step', 'error')
    }
}

loadRecipe()
