from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from learning.models import (
    Certificate,
    Challenge,
    FinalProject,
    Lesson,
    UserChallengeProgress,
    UserFinalProjectSubmission,
    UserLessonProgress,
)

from learning.serializers import LessonDetailSerializer, LessonListSerializer


def get_certificate_learner_name(user):
    full_name = str(getattr(user, "full_name", "")).strip()

    if full_name:
        return full_name

    first_name = str(getattr(user, "first_name", "")).strip()
    last_name = str(getattr(user, "last_name", "")).strip()
    name_from_parts = f"{first_name} {last_name}".strip()

    if name_from_parts:
        return name_from_parts

    username = str(getattr(user, "username", "")).strip()

    if username:
        return username

    email = str(getattr(user, "email", "")).strip()

    if email:
        return email.split("@")[0]

    return "CodeGuide Learner"


def get_required_challenge_stats(user):
    required_challenges = Challenge.objects.filter(
        lesson__is_published=True,
        is_required=True,
    )

    total_required_challenges = required_challenges.count()

    passed_required_challenges = UserChallengeProgress.objects.filter(
        user=user,
        challenge__in=required_challenges,
        is_passed=True,
    ).count()

    return {
        "total_required_challenges": total_required_challenges,
        "passed_required_challenges": passed_required_challenges,
        "is_learning_completed": (
            total_required_challenges > 0
            and passed_required_challenges == total_required_challenges
        ),
    }


def get_previous_published_lesson(lesson):
    return (
        Lesson.objects.filter(is_published=True, order__lt=lesson.order)
        .order_by("-order")
        .first()
    )


def get_next_published_lesson(lesson):
    return (
        Lesson.objects.filter(is_published=True, order__gt=lesson.order)
        .order_by("order")
        .first()
    )


def is_lesson_completed_by_user(user, lesson):
    if lesson is None:
        return True

    stored_progress_exists = UserLessonProgress.objects.filter(
        user=user,
        lesson=lesson,
        is_completed=True,
    ).exists()

    if stored_progress_exists:
        return True

    required_challenges = lesson.challenges.filter(is_required=True)

    if not required_challenges.exists():
        return False

    passed_required_count = UserChallengeProgress.objects.filter(
        user=user,
        challenge__in=required_challenges,
        is_passed=True,
    ).count()

    return passed_required_count == required_challenges.count()


def get_lesson_lock_state(user, lesson):
    previous_lesson = get_previous_published_lesson(lesson)

    if previous_lesson is None:
        return {
            "is_locked": False,
            "previous_lesson_title": None,
            "unlock_message": "This is the first lesson.",
        }

    previous_lesson_completed = is_lesson_completed_by_user(
        user=user,
        lesson=previous_lesson,
    )

    if previous_lesson_completed:
        return {
            "is_locked": False,
            "previous_lesson_title": previous_lesson.title,
            "unlock_message": "Lesson unlocked.",
        }

    return {
        "is_locked": True,
        "previous_lesson_title": previous_lesson.title,
        "unlock_message": f"Complete '{previous_lesson.title}' to unlock this lesson.",
    }


def serialize_lesson_navigation(user, lesson):
    next_lesson = get_next_published_lesson(lesson)

    if next_lesson is None:
        return {
            "next_lesson": None,
            "has_next_lesson": False,
            "final_project_available": get_required_challenge_stats(user)[
                "is_learning_completed"
            ],
        }

    lock_state = get_lesson_lock_state(user, next_lesson)

    return {
        "next_lesson": {
            "id": next_lesson.id,
            "title": next_lesson.title,
            "slug": next_lesson.slug,
            "order": next_lesson.order,
            "is_locked": lock_state["is_locked"],
            "unlock_message": lock_state["unlock_message"],
        },
        "has_next_lesson": True,
        "final_project_available": False,
    }


def serialize_certificate(certificate):
    if certificate is None:
        return None

    learner_name = str(getattr(certificate, "learner_name", "")).strip()

    if not learner_name:
        learner_name = get_certificate_learner_name(certificate.user)

    return {
        "id": certificate.id,
        "certificate_id": str(certificate.certificate_id),
        "title": certificate.title,
        "course_name": certificate.course_name,
        "learner_name": learner_name,
        "status": certificate.status,
        "issued_at": certificate.issued_at,
        "revoked_at": certificate.revoked_at,
        "revoke_reason": certificate.revoke_reason,
    }


def serialize_public_certificate(certificate):
    learner_name = str(getattr(certificate, "learner_name", "")).strip()

    if not learner_name:
        learner_name = get_certificate_learner_name(certificate.user)

    return {
        "certificate_id": str(certificate.certificate_id),
        "title": certificate.title,
        "course_name": certificate.course_name,
        "learner_name": learner_name,
        "status": certificate.status,
        "issued_at": certificate.issued_at,
        "revoked_at": certificate.revoked_at,
    }


def has_completed_final_project(user):
    return UserFinalProjectSubmission.objects.filter(
        user=user,
        project__is_published=True,
        is_completed=True,
    ).exists()


def get_certificate_eligibility(user):
    challenge_stats = get_required_challenge_stats(user)
    final_project_completed = has_completed_final_project(user)
    certificate = Certificate.objects.filter(user=user).first()

    learning_completed = challenge_stats["is_learning_completed"]
    requirements_met = learning_completed and final_project_completed

    certificate_is_revoked = (
        certificate is not None and certificate.status == Certificate.STATUS_REVOKED
    )

    if not learning_completed:
        reason = "Complete all required challenges before requesting a certificate."
    elif not final_project_completed:
        reason = "Submit the final project before requesting a certificate."
    elif certificate_is_revoked:
        reason = "This certificate was revoked and cannot be issued again."
    elif certificate is not None:
        reason = "Certificate already issued."
    else:
        reason = "Eligible for certificate."

    return {
        "total_required_challenges": challenge_stats["total_required_challenges"],
        "passed_required_challenges": challenge_stats["passed_required_challenges"],
        "learning_completed": learning_completed,
        "final_project_completed": final_project_completed,
        "requirements_met": requirements_met,
        "certificate_exists": certificate is not None,
        "certificate_is_revoked": certificate_is_revoked,
        "can_issue": requirements_met and certificate is None,
        "reason": reason,
        "certificate": certificate,
    }


def serialize_final_project(project):
    return {
        "id": project.id,
        "title": project.title,
        "slug": project.slug,
        "instructions": project.instructions,
        "requirements": project.requirements,
        "starter_ideas": project.starter_ideas,
    }


def serialize_final_project_submission(submission):
    if submission is None:
        return None

    return {
        "id": submission.id,
        "project_title": submission.project_title,
        "description": submission.description,
        "source_code": submission.source_code,
        "is_completed": submission.is_completed,
        "submitted_at": submission.submitted_at,
        "updated_at": submission.updated_at,
    }


def update_lesson_completion(user, lesson):
    required_challenges = lesson.challenges.filter(is_required=True)

    if not required_challenges.exists():
        return False

    passed_required_count = UserChallengeProgress.objects.filter(
        user=user,
        challenge__in=required_challenges,
        is_passed=True,
    ).count()

    if passed_required_count != required_challenges.count():
        return False

    lesson_progress, _ = UserLessonProgress.objects.get_or_create(
        user=user,
        lesson=lesson,
    )

    if not lesson_progress.is_completed:
        lesson_progress.mark_completed()

    return True


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lesson_list_view(request):
    lessons = (
        Lesson.objects.filter(is_published=True)
        .order_by("order")
        .prefetch_related(
            "challenges",
            "user_progress",
        )
    )

    serializer = LessonListSerializer(
        lessons,
        many=True,
        context={"request": request},
    )

    return Response(
        {
            "lessons": serializer.data,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def progress_summary_view(request):
    total_lessons = Lesson.objects.filter(is_published=True).count()

    completed_lessons = UserLessonProgress.objects.filter(
        user=request.user,
        lesson__is_published=True,
        is_completed=True,
    ).count()

    challenge_stats = get_required_challenge_stats(request.user)

    total_required_challenges = challenge_stats["total_required_challenges"]
    passed_required_challenges = challenge_stats["passed_required_challenges"]

    if total_required_challenges == 0:
        progress_percentage = 0
    else:
        progress_percentage = round(
            (passed_required_challenges / total_required_challenges) * 100
        )

    final_project_completed = UserFinalProjectSubmission.objects.filter(
        user=request.user,
        project__is_published=True,
        is_completed=True,
    ).exists()

    return Response(
        {
            "summary": {
                "total_lessons": total_lessons,
                "completed_lessons": completed_lessons,
                "total_required_challenges": total_required_challenges,
                "passed_required_challenges": passed_required_challenges,
                "progress_percentage": progress_percentage,
                "final_project_completed": final_project_completed,
            }
        }
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def final_project_view(request):
    project = FinalProject.objects.filter(is_published=True).first()

    if project is None:
        return Response(
            {
                "detail": "Final project not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    challenge_stats = get_required_challenge_stats(request.user)

    submission = UserFinalProjectSubmission.objects.filter(
        user=request.user,
        project=project,
    ).first()

    if request.method == "GET":
        return Response(
            {
                "project": serialize_final_project(project),
                "learning": challenge_stats,
                "submission": serialize_final_project_submission(submission),
            }
        )

    if not challenge_stats["is_learning_completed"]:
        return Response(
            {
                "detail": "Complete all required challenges before submitting the final project.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    project_title = str(request.data.get("project_title", "")).strip()
    description = str(request.data.get("description", "")).strip()
    source_code = str(request.data.get("source_code", "")).strip()

    if len(project_title) < 3:
        return Response(
            {
                "detail": "Project title must be at least 3 characters.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(description) < 30:
        return Response(
            {
                "detail": "Description must be at least 30 characters.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(source_code) < 30:
        return Response(
            {
                "detail": "Source code must be at least 30 characters.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    submission, created = UserFinalProjectSubmission.objects.update_or_create(
        user=request.user,
        project=project,
        defaults={
            "project_title": project_title,
            "description": description,
            "source_code": source_code,
            "is_completed": True,
            "submitted_at": timezone.now(),
        },
    )

    return Response(
        {
            "message": "Final project submitted successfully.",
            "submission": serialize_final_project_submission(submission),
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lesson_detail_view(request, slug):
    lesson = (
        Lesson.objects.filter(is_published=True, slug=slug)
        .prefetch_related(
            "challenges__test_cases",
            "challenges__hints",
            "challenges__user_progress",
            "user_progress",
        )
        .first()
    )

    if lesson is None:
        return Response(
            {
                "detail": "Lesson not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    lock_state = get_lesson_lock_state(request.user, lesson)

    if lock_state["is_locked"]:
        return Response(
            {
                "detail": lock_state["unlock_message"],
                "lock": lock_state,
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = LessonDetailSerializer(
        lesson,
        context={"request": request},
    )

    return Response(
        {
            "lesson": serializer.data,
            "navigation": serialize_lesson_navigation(request.user, lesson),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_challenge_view(request, challenge_id):
    challenge = (
        Challenge.objects.select_related("lesson")
        .filter(id=challenge_id, lesson__is_published=True)
        .first()
    )

    if challenge is None:
        return Response(
            {
                "detail": "Challenge not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    lock_state = get_lesson_lock_state(request.user, challenge.lesson)

    if lock_state["is_locked"]:
        return Response(
            {
                "detail": lock_state["unlock_message"],
                "lock": lock_state,
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    progress, _ = UserChallengeProgress.objects.get_or_create(
        user=request.user,
        challenge=challenge,
    )

    progress.mark_passed()

    lesson_completed = update_lesson_completion(
        user=request.user,
        lesson=challenge.lesson,
    )

    return Response(
        {
            "message": "Challenge progress saved.",
            "challenge": {
                "id": challenge.id,
                "is_passed": progress.is_passed,
                "attempts": progress.attempts,
            },
            "lesson": {
                "id": challenge.lesson.id,
                "slug": challenge.lesson.slug,
                "is_completed": lesson_completed,
            },
            "navigation": serialize_lesson_navigation(request.user, challenge.lesson),
        }
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def certificate_view(request):
    eligibility = get_certificate_eligibility(request.user)
    certificate = eligibility["certificate"]

    if request.method == "GET":
        return Response(
            {
                "eligibility": {
                    "total_required_challenges": eligibility[
                        "total_required_challenges"
                    ],
                    "passed_required_challenges": eligibility[
                        "passed_required_challenges"
                    ],
                    "learning_completed": eligibility["learning_completed"],
                    "final_project_completed": eligibility[
                        "final_project_completed"
                    ],
                    "requirements_met": eligibility["requirements_met"],
                    "certificate_exists": eligibility["certificate_exists"],
                    "certificate_is_revoked": eligibility[
                        "certificate_is_revoked"
                    ],
                    "can_issue": eligibility["can_issue"],
                    "reason": eligibility["reason"],
                },
                "certificate": serialize_certificate(certificate),
            }
        )

    if certificate is not None:
        if certificate.status == Certificate.STATUS_REVOKED:
            return Response(
                {
                    "detail": "This certificate was revoked and cannot be issued again.",
                    "certificate": serialize_certificate(certificate),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            {
                "message": "Certificate already issued.",
                "certificate": serialize_certificate(certificate),
            }
        )

    if not eligibility["requirements_met"]:
        return Response(
            {
                "detail": eligibility["reason"],
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    certificate = Certificate.objects.create(user=request.user)

    return Response(
        {
            "message": "Certificate issued successfully.",
            "certificate": serialize_certificate(certificate),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def public_certificate_verify_view(request, certificate_id):
    certificate = Certificate.objects.select_related("user").filter(
        certificate_id=certificate_id,
    ).first()

    if certificate is None:
        return Response(
            {
                "verified": False,
                "detail": "Certificate not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    is_valid = certificate.status == Certificate.STATUS_VALID

    return Response(
        {
            "verified": is_valid,
            "certificate": serialize_public_certificate(certificate),
        }
    )