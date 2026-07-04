from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/<int:pk>/', views.PublicProfileView.as_view(), name='public-profile'),
    path('follow/<int:pk>/', views.FollowView.as_view(), name='follow'),
    path('profile/update/', views.UpdateProfileView.as_view(), name='update-profile'),
]
