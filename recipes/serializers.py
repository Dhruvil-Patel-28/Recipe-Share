# TagSerializer
# IngredientSerializer
# StepSerializer
# RecipeSerializer — with nested ingredients, steps and tags

from rest_framework import serializers
from .models import Recipe, Tag, Ingredient, Step, Like, Collection

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'quantity', 'unit']

class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = ['id', 'order', 'instruction']

class RecipeSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    ingredients = IngredientSerializer(many=True, read_only=True)
    steps = StepSerializer(many=True, read_only=True)
    author = serializers.StringRelatedField(read_only=True)
    likes_count = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'cover_image',
            'prep_time', 'cook_time', 'difficulty', 'cuisine',
            'is_published', 'author', 'created_at',
            'tags', 'ingredients', 'steps', 'likes_count'
        ]
    
    def get_likes_count(self, obj):
        return obj.likes.count()

class CollectionSerializer(serializers.ModelSerializer):
    recipes = RecipeSerializer(many=True, read_only=True)
    
    class Meta:
        model = Collection
        fields = ['id', 'name', 'is_public', 'recipes']