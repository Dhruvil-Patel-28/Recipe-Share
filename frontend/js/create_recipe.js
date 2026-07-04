requireAuth()

// ---- Image Preview ----
function previewImage(input) {
    const preview = document.getElementById('imagePreview')
    const previewImg = document.getElementById('previewImg')
    const uploadArea = document.getElementById('uploadArea')

    if (input.files && input.files[0]) {
        const reader = new FileReader()
        reader.onload = function(e) {
            previewImg.src = e.target.result
            preview.classList.add('has-image')
            uploadArea.querySelector('.upload-icon').textContent = '✓'
            uploadArea.querySelector('.upload-text').textContent = 'Image selected. Click to change.'
        }
        reader.readAsDataURL(input.files[0])
    }
}

// ---- Dynamic Ingredient Rows ----
let ingredientCount = 0

function addIngredientRow() {
    ingredientCount++
    const container = document.getElementById('ingredientsList')
    const row = document.createElement('div')
    row.className = 'dynamic-list-item'
    row.id = `ingredient-row-${ingredientCount}`
    row.innerHTML = `
        <input type="text" class="form-input" placeholder="Name (e.g. Chicken)" data-field="name" />
        <input type="number" class="form-input" placeholder="Qty" data-field="quantity" style="max-width:80px" step="any" />
        <input type="text" class="form-input" placeholder="Unit (e.g. grams)" data-field="unit" style="max-width:120px" />
        <button type="button" class="btn-remove" onclick="removeRow('ingredient-row-${ingredientCount}')">✕</button>
    `
    container.appendChild(row)
}

// ---- Dynamic Step Rows ----
let stepCount = 0

function addStepRow() {
    stepCount++
    const container = document.getElementById('stepsList')
    const row = document.createElement('div')
    row.className = 'dynamic-list-item'
    row.id = `step-row-${stepCount}`
    row.innerHTML = `
        <span style="color:var(--color-text-muted);font-size:0.85rem;flex-shrink:0">Step ${container.children.length + 1}</span>
        <input type="text" class="form-input" placeholder="Describe this step..." data-field="instruction" />
        <button type="button" class="btn-remove" onclick="removeRow('step-row-${stepCount}')">✕</button>
    `
    container.appendChild(row)
}

function removeRow(rowId) {
    const row = document.getElementById(rowId)
    if (row) row.remove()
    // Re-number steps
    const stepRows = document.querySelectorAll('#stepsList .dynamic-list-item')
    stepRows.forEach((r, i) => {
        const label = r.querySelector('span')
        if (label) label.textContent = `Step ${i + 1}`
    })
}

// ---- Collect ingredients & steps data ----
function collectIngredients() {
    const rows = document.querySelectorAll('#ingredientsList .dynamic-list-item')
    const ingredients = []
    rows.forEach(row => {
        const name = row.querySelector('[data-field="name"]').value.trim()
        const quantity = row.querySelector('[data-field="quantity"]').value
        const unit = row.querySelector('[data-field="unit"]').value.trim()
        if (name && quantity) {
            ingredients.push({ name, quantity, unit })
        }
    })
    return ingredients
}

function collectSteps() {
    const rows = document.querySelectorAll('#stepsList .dynamic-list-item')
    const steps = []
    rows.forEach((row, index) => {
        const instruction = row.querySelector('[data-field="instruction"]').value.trim()
        if (instruction) {
            steps.push({ order: index + 1, instruction })
        }
    })
    return steps
}

// ---- Form Submit ----
document.getElementById('createRecipeForm').addEventListener('submit', async function(e) {
    e.preventDefault()
    const btn = document.getElementById('submitBtn')
    btn.disabled = true
    btn.textContent = 'Creating...'

    const formData = new FormData()
    formData.append('title', document.getElementById('title').value.trim())
    formData.append('description', document.getElementById('description').value.trim())
    formData.append('prep_time', document.getElementById('prep_time').value)
    formData.append('cook_time', document.getElementById('cook_time').value)
    formData.append('cuisine', document.getElementById('cuisine').value.trim())
    formData.append('is_published', document.getElementById('is_published').checked)

    // Get selected difficulty
    const difficulty = document.querySelector('input[name="difficulty"]:checked')
    formData.append('difficulty', difficulty ? difficulty.value : 'easy')

    const imageFile = document.getElementById('cover_image').files[0]
    if (imageFile) {
        formData.append('cover_image', imageFile)
    }

    try {
        const response = await apiCallFormData('/recipes/', 'POST', formData)
        const data = await response.json()

        if (response.ok) {
            // Now add ingredients and steps
            const recipeId = data.id
            const ingredients = collectIngredients()
            const steps = collectSteps()

            for (const ing of ingredients) {
                await apiCall(`/recipes/${recipeId}/add_ingredient/`, 'POST', ing)
            }
            for (const step of steps) {
                await apiCall(`/recipes/${recipeId}/add_step/`, 'POST', step)
            }

            showToast('Recipe created!', 'success')
            setTimeout(() => {
                window.location.href = `recipe.html?id=${recipeId}`
            }, 1000)
        } else {
            const errors = Object.values(data).flat().join(', ')
            showToast(errors || 'Failed to create recipe', 'error')
        }
    } catch (err) {
        showToast('Network error. Please try again.', 'error')
    } finally {
        btn.disabled = false
        btn.textContent = 'Create Recipe'
    }
})

// Add initial rows
addIngredientRow()
addStepRow()
