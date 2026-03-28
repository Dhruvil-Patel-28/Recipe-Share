from django.contrib import admin
from .models import Recipe, Tag, Ingredient, Step, Like, Collection

# Register your models here.
admin.site.register(Recipe)
admin.site.register(Tag)
admin.site.register(Ingredient)
admin.site.register(Step)
admin.site.register(Like)
admin.site.register(Collection)
