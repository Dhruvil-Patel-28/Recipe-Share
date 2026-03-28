# GET /api/recipes/ — list all published recipes
# POST /api/recipes/ — create a new recipe
# GET /api/recipes/1/ — get a single recipe by id
# PUT /api/recipes/1/ — update a recipe
# DELETE /api/recipes/1/ — delete a recipe
# GET /api/recipes/search/ — search by ingredients or title

from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Recipe, Tag, Ingredient, Step, Like, Collection
from .serializers import RecipeSerializer, TagSerializer

#---------------------------------------------------------------------------------------------
# ModelViewSet already has these methods written:

# list() — handles GET /api/recipes/
# create() — handles POST /api/recipes/
# retrieve() — handles GET /api/recipes/1/
# update() — handles PUT /api/recipes/1/
# partial_update() — handles PATCH /api/recipes/1/
# destroy() — handles DELETE /api/recipes/1/
#----------------------------------------------------------------------------------------------

# Create your views here.

class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.filter(is_published=True)
    serializer_class = RecipeSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return []

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)




# This method is called automatically by DRF after the serializer has validated the data, right before saving to the database.

# `serializer` — the already-validated serializer with all the recipe data.

# `serializer.save(author=self.request.user)` — saves the recipe to database and injects `author=request.user` automatically.

# **Why we do this:** If we didn't override `perform_create`, the user would have to manually send `author: 1` in the request body. That's a security problem — they could fake any author id. By setting it here from `request.user`, we guarantee the author is always the logged in user. No way to fake it.

# `self.request.user` — DRF attaches the logged in user to the request after validating the JWT token. So this is always the real logged in user.


# ## Full flow when POST /api/recipes/ comes in

# POST /api/recipes/ with JWT token + recipe data
#             ↓
# Router sends to RecipeViewSet
#             ↓
# get_permissions runs
# action = 'create' → return [IsAuthenticated()]
# IsAuthenticated checks JWT token → valid → proceed
#             ↓
# RecipeSerializer validates incoming data
# title present? ✅ cook_time valid? ✅ etc.
#             ↓
# perform_create runs
# serializer.save(author=request.user)
# saves to database
#             ↓
# Returns created recipe as JSON with 201