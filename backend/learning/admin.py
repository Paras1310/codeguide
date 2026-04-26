from django.contrib import admin

from learning.models import (
    Certificate,
    Challenge,
    ChallengeHint,
    ChallengeTestCase,
    FinalProject,
    Lesson,
    UserChallengeProgress,
    UserFinalProjectSubmission,
    UserLessonProgress,
)

class ChallengeInline(admin.TabularInline):
    model = Challenge
    extra = 1


class ChallengeHintInline(admin.TabularInline):
    model = ChallengeHint
    extra = 1


class ChallengeTestCaseInline(admin.TabularInline):
    model = ChallengeTestCase
    extra = 1


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ["order", "title", "level", "is_published"]
    list_filter = ["level", "is_published"]
    search_fields = ["title", "concept"]
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ChallengeInline]


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ["title", "lesson", "challenge_type", "order", "is_required"]
    list_filter = ["challenge_type", "is_required"]
    search_fields = ["title", "instructions"]
    inlines = [ChallengeHintInline, ChallengeTestCaseInline]


@admin.register(ChallengeHint)
class ChallengeHintAdmin(admin.ModelAdmin):
    list_display = ["challenge", "order", "text"]
    search_fields = ["text"]


@admin.register(ChallengeTestCase)
class ChallengeTestCaseAdmin(admin.ModelAdmin):
    list_display = ["name", "challenge", "function_name", "order"]
    search_fields = ["name", "function_name"]


@admin.register(UserLessonProgress)
class UserLessonProgressAdmin(admin.ModelAdmin):
    list_display = ["user", "lesson", "is_completed", "completed_at"]
    list_filter = ["is_completed"]


@admin.register(UserChallengeProgress)
class UserChallengeProgressAdmin(admin.ModelAdmin):
    list_display = ["user", "challenge", "is_passed", "attempts", "passed_at"]
    list_filter = ["is_passed"]

@admin.register(FinalProject)
class FinalProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "is_published", "created_at"]
    search_fields = ["title", "slug"]


@admin.register(UserFinalProjectSubmission)
class UserFinalProjectSubmissionAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "project",
        "project_title",
        "is_completed",
        "submitted_at",
    ]
    list_filter = ["is_completed", "project"]
    search_fields = ["user__email", "project_title", "description"]
    readonly_fields = ["submitted_at", "updated_at"]

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "certificate_id",
        "title",
        "course_name",
        "status",
        "issued_at",
    ]
    list_filter = ["status", "course_name"]
    search_fields = ["user__email", "certificate_id", "course_name"]
    readonly_fields = ["certificate_id", "issued_at"]