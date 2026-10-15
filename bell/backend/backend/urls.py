from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from api.views import RegisterView, BellDataViewSet, ScheduleViewSet
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView


router = routers.DefaultRouter()
router.register(r'belldata', BellDataViewSet, basename='belldata')
router.register(r'schedule', ScheduleViewSet, basename='schedule')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
    path("register/", RegisterView.as_view(), name="register"),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]