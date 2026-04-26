from django.contrib.auth import authenticate, get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import validate_email

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def serialize_user(user):
    full_name = user.get_full_name().strip()

    if not full_name:
        full_name = user.username

    return {
        "id": user.id,
        "full_name": full_name,
        "email": user.email,
        "is_staff": user.is_staff,
    }


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def normalize_email(value):
    return str(value or "").strip().lower()


def split_full_name(full_name):
    parts = full_name.strip().split(maxsplit=1)

    first_name = parts[0] if parts else ""
    last_name = parts[1] if len(parts) > 1 else ""

    return first_name, last_name


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    full_name = str(request.data.get("full_name", "")).strip()
    email = normalize_email(request.data.get("email"))
    password = str(request.data.get("password", ""))

    if len(full_name) < 2:
        return Response(
            {
                "detail": "Full name must be at least 2 characters.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_email(email)
    except ValidationError:
        return Response(
            {
                "detail": "Enter a valid email address.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(password) < 8:
        return Response(
            {
                "detail": "Password must be at least 8 characters.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {
                "detail": "An account with this email already exists.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username__iexact=email).exists():
        return Response(
            {
                "detail": "An account with this email already exists.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    first_name, last_name = split_full_name(full_name)

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )

    return Response(
        {
            "message": "Registration successful.",
            "user": serialize_user(user),
            "tokens": get_tokens_for_user(user),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    email = normalize_email(request.data.get("email"))
    password = str(request.data.get("password", ""))

    if not email or not password:
        return Response(
            {
                "detail": "Email and password are required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    matching_users = User.objects.filter(email__iexact=email)

    if matching_users.count() > 1:
        return Response(
            {
                "detail": "Multiple accounts exist with this email. Clean duplicate accounts before logging in.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = matching_users.first()

    if user is None:
        return Response(
            {
                "detail": "Invalid email or password.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    authenticated_user = authenticate(
        username=user.username,
        password=password,
    )

    if authenticated_user is None:
        return Response(
            {
                "detail": "Invalid email or password.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return Response(
        {
            "message": "Login successful.",
            "user": serialize_user(authenticated_user),
            "tokens": get_tokens_for_user(authenticated_user),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(
        {
            "user": serialize_user(request.user),
        }
    )


profile_view = me_view