from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('recipes', views.RecipeViewSet)
# this automatically creates all the CRUD routes for recipes based on the methods defined in RecipeViewSet. No need to write them manually.

urlpatterns = [
    path('', include(router.urls)),
]