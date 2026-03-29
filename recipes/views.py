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
from .serializers import RecipeSerializer, TagSerializer, IngredientSerializer, StepSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema

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

    @extend_schema(request=IngredientSerializer)
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_ingredient(self, request, pk=None):
        recipe = self.get_object()
        if recipe.author != request.user:
            return Response({'error': 'You are not the author of this recipe'}, status=status.HTTP_403_FORBIDDEN)
        serializer = IngredientSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(recipe=recipe)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(request=StepSerializer)
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_step(self, request, pk=None):
        recipe = self.get_object()
        if recipe.author != request.user:
            return Response({'error': 'You are not the author of this recipe'}, status=status.HTTP_403_FORBIDDEN)
        serializer = StepSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(recipe=recipe)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(request=None)
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        recipe = self.get_object()
        like = Like.objects.filter(user=request.user, recipe=recipe)
        if like.exists():
            like.delete()
            return Response({'message': 'Recipe unliked'}, status=status.HTTP_200_OK)
        Like.objects.create(user=request.user, recipe=recipe)
        return Response({'message': 'Recipe liked'}, status=status.HTTP_201_CREATED)


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