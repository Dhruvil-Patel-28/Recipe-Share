# GET /api/recipes/ — list all published recipes
# POST /api/recipes/ — create a new recipe
# GET /api/recipes/1/ — get a single recipe by id
# PUT /api/recipes/1/ — update a recipe
# DELETE /api/recipes/1/ — delete a recipe
# GET /api/recipes/search/ — search by ingredients or title
# DELETE /api/recipes/1/delete_ingredient/ — delete an ingredient (author only)
# DELETE /api/recipes/1/delete_step/ — delete a step (author only)
# GET /api/recipes/my_recipes/ — get current user's recipes

from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Recipe, Tag, Ingredient, Step, Like, Collection
from .serializers import RecipeSerializer, TagSerializer, IngredientSerializer, StepSerializer, CollectionSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, inline_serializer
from django.db.models import Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from rest_framework import serializers
from users.models import User
from users.serializers import UserProfileSerializer


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
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer

    def get_queryset(self):
        queryset = Recipe.objects.filter(is_published=True).order_by('-created_at')
        author_id = self.request.query_params.get('author')
        if author_id:
            queryset = queryset.filter(author_id=author_id)
        return queryset

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
            return Response({'message': 'Recipe unliked', 'liked': False}, status=status.HTTP_200_OK)
        Like.objects.create(user=request.user, recipe=recipe)
        return Response({'message': 'Recipe liked', 'liked': True}, status=status.HTTP_201_CREATED)

    @extend_schema(request=inline_serializer(
        name='DeleteIngredientSerializer',
        fields={'ingredient_id': serializers.IntegerField()}
    ))
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def delete_ingredient(self, request, pk=None):
        recipe = self.get_object()
        if recipe.author != request.user:
            return Response({'error': 'You are not the author of this recipe'}, status=status.HTTP_403_FORBIDDEN)
        ingredient_id = request.data.get('ingredient_id')
        try:
            ingredient = Ingredient.objects.get(pk=ingredient_id, recipe=recipe)
            ingredient.delete()
            return Response({'message': 'Ingredient deleted'}, status=status.HTTP_200_OK)
        except Ingredient.DoesNotExist:
            return Response({'error': 'Ingredient not found'}, status=status.HTTP_404_NOT_FOUND)

    @extend_schema(request=inline_serializer(
        name='DeleteStepSerializer',
        fields={'step_id': serializers.IntegerField()}
    ))
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def delete_step(self, request, pk=None):
        recipe = self.get_object()
        if recipe.author != request.user:
            return Response({'error': 'You are not the author of this recipe'}, status=status.HTTP_403_FORBIDDEN)
        step_id = request.data.get('step_id')
        try:
            step = Step.objects.get(pk=step_id, recipe=recipe)
            step.delete()
            return Response({'message': 'Step deleted'}, status=status.HTTP_200_OK)
        except Step.DoesNotExist:
            return Response({'error': 'Step not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @extend_schema(
        parameters=[
            OpenApiParameter(name='q', description='Search by title, description or tags', required=False, type=str),
            OpenApiParameter(name='ingredients', description='Search by ingredients, comma separated', required=False, type=str),
        ]
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        ingredients = request.query_params.get('ingredients', '')

        recipes = Recipe.objects.filter(is_published=True)

        if query:
            recipes = recipes.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(tags__name__icontains=query)
            ).distinct()

        if ingredients:
            ingredient_list = [i.strip() for i in ingredients.split(',')]
            for ingredient in ingredient_list:
                recipes = recipes.filter(ingredients__name__icontains=ingredient)

        page = self.paginate_queryset(recipes)
        if page is not None:
            serializer = RecipeSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = RecipeSerializer(recipes, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def feed(self, request):
        following_users = request.user.following.all()
        recipes = Recipe.objects.filter(
            author__in=following_users,
            is_published=True
        ).order_by('-created_at')

        page = self.paginate_queryset(recipes)
        if page is not None:
            serializer = RecipeSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = RecipeSerializer(recipes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_recipes(self, request):
        recipes = Recipe.objects.filter(author=request.user).order_by('-created_at')

        page = self.paginate_queryset(recipes)
        if page is not None:
            serializer = RecipeSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = RecipeSerializer(recipes, many=True)
        return Response(serializer.data)

class CollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Collection.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @extend_schema(request=inline_serializer(
        name='AddRecipeSerializer',
        fields={'recipe_id': serializers.IntegerField()}
    ))
    @action(detail=True, methods=['post'])
    def add_recipe(self, request, pk=None):
        collection = self.get_object()
        recipe_id = request.data.get('recipe_id')
        try:
            recipe = Recipe.objects.get(pk=recipe_id)
            collection.recipes.add(recipe)
            return Response({'message': 'Recipe added to collection'}, status=status.HTTP_200_OK)
        except Recipe.DoesNotExist:
            return Response({'error': 'Recipe not found'}, status=status.HTTP_404_NOT_FOUND)
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