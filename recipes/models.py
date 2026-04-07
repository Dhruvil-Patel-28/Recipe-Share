# Recipe — the main model
# Ingredient — linked to Recipe
# Step — linked to Recipe, has an order number
# Tag — linked to Recipe (many to many)
# Like — links User to Recipe
# Collection — belongs to User
# CollectionRecipe — links Collection to Recipe
#-----------------------------------------------------------------------------------------------------

from django.db import models

# Create your models here.
#-----------------------------------------------------------------------------------------------------
# Recipe — the main model
# title
# description
# cover_image — ImageField
# prep_time — in minutes, IntegerField
# cook_time — in minutes, IntegerField
# difficulty — choices: easy, medium, hard
# cuisine — e.g. Indian, Italian etc.
# is_published — BooleanField, default False
# author — ForeignKey to User
# created_at — auto timestamp
# tags — ManyToMany to a Tag model

class Recipe(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    cover_image = models.ImageField(upload_to='recipe_covers/', blank=True, null=True)
    prep_time = models.IntegerField()
    cook_time = models.IntegerField()
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    cuisine = models.CharField(max_length=100)
    is_published = models.BooleanField(default=False)
    author = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='recipes')
    created_at = models.DateTimeField(auto_now_add=True)
    tags = models.ManyToManyField('Tag', related_name='recipes')

    def __str__(self):
        return self.title 

#----------------------------------------------------------------------------------------------------
# Tag — just a name field, simple as that
# Ingredient — linked to Recipe with:

# recipe — ForeignKey to Recipe
# name
# quantity — DecimalField
# unit — e.g. cups, grams, tbsp

class Tag(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class Ingredient(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredients')
    name = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)
    
    def __str__(self):
        return f"{self.quantity} {self.unit} {self.name}"

#----------------------------------------------------------------------------------------------------
# Step — linked to Recipe with:

# recipe — ForeignKey to Recipe
# order — IntegerField (step 1, step 2...)
# instruction — TextField

class Step(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='steps')
    order = models.IntegerField()
    instruction = models.TextField()

    def __str__(self):
        return f"Step {self.order} for {self.recipe.title}"

#----------------------------------------------------------------------------------------------------
# Like — links User to Recipe:

# user — ForeignKey to User
# recipe — ForeignKey to Recipe
# created_at

# class Like(models.Model):
#     user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='likes')
#     recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='likes')
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"{self.user.username} likes {self.recipe.title}"


#-----------------------------------------------------------------------------------------------------
# Collection — belongs to User:

# user — ForeignKey to User
# name
# is_public — BooleanField
# recipes — ManyToMany to Recipe

class Collection(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='collections')
    name = models.CharField(max_length=255)
    is_public = models.BooleanField(default=False)
    recipes = models.ManyToManyField(Recipe, related_name='collections')

    def __str__(self):
        return self.name

class Like(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='likes')
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'recipe']
        indexes = [
            models.Index(fields=['user', 'recipe'])
        ]

    def __str__(self):
        return f"{self.user.username} likes {self.recipe.title}"