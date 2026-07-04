requireAuth()

let currentPage = 1
let currentSearch = ''
let totalPages = 1

async function loadRecipes(page = 1, search = '') {
    const recipeList = document.getElementById('recipeList')
    renderRecipeSkeletons(recipeList)

    let endpoint = `/recipes/?page=${page}`
    if (search) {
        endpoint = `/recipes/search/?q=${encodeURIComponent(search)}&page=${page}`
    }

    try {
        const response = await apiCall(endpoint)
        const data = await response.json()

        // Handle paginated response
        let recipes = []
        let hasNext = false
        let hasPrev = false
        let count = 0

        if (data.results) {
            recipes = data.results
            hasNext = !!data.next
            hasPrev = !!data.previous
            count = data.count
            totalPages = Math.ceil(count / 10)
        } else if (Array.isArray(data)) {
            recipes = data
        }

        recipeList.innerHTML = ''

        if (recipes.length === 0) {
            renderEmptyState(recipeList, '🍳', search ? 'No recipes match your search.' : 'No recipes yet. Be the first to share one!')
            document.getElementById('pagination').style.display = 'none'
            return
        }

        recipes.forEach(recipe => {
            recipeList.innerHTML += createRecipeCard(recipe)
        })

        // Pagination
        const pagination = document.getElementById('pagination')
        if (hasNext || hasPrev) {
            pagination.style.display = 'flex'
            document.getElementById('prevBtn').disabled = !hasPrev
            document.getElementById('nextBtn').disabled = !hasNext
            document.getElementById('pageInfo').textContent = `Page ${page} of ${totalPages}`
        } else {
            pagination.style.display = 'none'
        }
    } catch (err) {
        recipeList.innerHTML = ''
        renderEmptyState(recipeList, '⚠️', 'Something went wrong loading recipes.')
    }
}

function createRecipeCard(recipe) {
    const imgHtml = recipe.cover_image
        ? `<img class="recipe-card-img" src="${recipe.cover_image}" alt="${recipe.title}" />`
        : `<div class="recipe-card-img-placeholder">🍽️</div>`

    const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)

    return `
        <div class="recipe-card">
            <a href="recipe.html?id=${recipe.id}">${imgHtml}</a>
            <div class="recipe-card-body">
                <h3><a href="recipe.html?id=${recipe.id}">${recipe.title}</a></h3>
                <div class="recipe-card-meta">
                    <span>⏱ ${totalTime} min</span>
                    <span>👨‍🍳 ${recipe.difficulty}</span>
                    <span>🍴 ${recipe.cuisine || 'Global'}</span>
                </div>
                <p class="recipe-card-desc">${recipe.description || ''}</p>
                <div class="recipe-card-footer">
                    <span class="author">by ${recipe.author}</span>
                    <span class="likes">❤ ${recipe.likes_count}</span>
                </div>
            </div>
        </div>
    `
}

function handleSearch(e) {
    e.preventDefault()
    currentSearch = document.getElementById('searchInput').value.trim()
    currentPage = 1
    loadRecipes(currentPage, currentSearch)
}

function changePage(delta) {
    currentPage += delta
    if (currentPage < 1) currentPage = 1
    loadRecipes(currentPage, currentSearch)
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

loadRecipes()
