from django.conf import settings
from django.db import models
from django.utils import timezone
import uuid


class Lesson(models.Model):
    LEVEL_BEGINNER = "beginner"
    LEVEL_INTERMEDIATE = "intermediate"

    LEVEL_CHOICES = [
        (LEVEL_BEGINNER, "Beginner"),
        (LEVEL_INTERMEDIATE, "Intermediate"),
    ]

    title = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180, unique=True)
    order = models.PositiveIntegerField(unique=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)

    concept = models.CharField(max_length=200)
    explanation = models.TextField()
    syntax = models.TextField(blank=True)
    example = models.TextField(blank=True)
    common_mistakes = models.JSONField(default=list, blank=True)
    recap = models.TextField(blank=True)

    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.order}. {self.title}"


class Challenge(models.Model):
    TYPE_PRACTICE = "practice"
    TYPE_DEBUG = "debug"

    TYPE_CHOICES = [
        (TYPE_PRACTICE, "Practice"),
        (TYPE_DEBUG, "Debug"),
    ]

    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="challenges",
    )
    title = models.CharField(max_length=150)
    challenge_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    instructions = models.TextField()
    starter_code = models.TextField()
    order = models.PositiveIntegerField(default=1)
    is_required = models.BooleanField(default=True)

    class Meta:
        ordering = ["lesson__order", "order"]
        unique_together = ["lesson", "order"]

    def __str__(self):
        return f"{self.lesson.title} - {self.title}"


class ChallengeHint(models.Model):
    challenge = models.ForeignKey(
        Challenge,
        on_delete=models.CASCADE,
        related_name="hints",
    )
    text = models.TextField()
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["challenge__lesson__order", "challenge__order", "order"]
        unique_together = ["challenge", "order"]

    def __str__(self):
        return f"{self.challenge.title} - Hint {self.order}"


class ChallengeTestCase(models.Model):
    challenge = models.ForeignKey(
        Challenge,
        on_delete=models.CASCADE,
        related_name="test_cases",
    )
    name = models.CharField(max_length=120)
    function_name = models.CharField(max_length=120)
    input_data = models.JSONField(default=list)
    expected_output = models.JSONField()
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["challenge__lesson__order", "challenge__order", "order"]

    def __str__(self):
        return f"{self.challenge.title} - {self.name}"


class UserLessonProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lesson_progress",
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="user_progress",
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ["user", "lesson"]

    def mark_completed(self):
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save(update_fields=["is_completed", "completed_at"])

    def __str__(self):
        return f"{self.user.email} - {self.lesson.title}"


class UserChallengeProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="challenge_progress",
    )
    challenge = models.ForeignKey(
        Challenge,
        on_delete=models.CASCADE,
        related_name="user_progress",
    )
    is_passed = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    passed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ["user", "challenge"]

    def mark_passed(self):
        self.attempts += 1
        self.is_passed = True
        self.passed_at = timezone.now()
        self.save(update_fields=["attempts", "is_passed", "passed_at"])

    def __str__(self):
        return f"{self.user.email} - {self.challenge.title}"
    

class FinalProject(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    instructions = models.TextField()
    requirements = models.JSONField(default=list, blank=True)
    starter_ideas = models.JSONField(default=list, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.title


class UserFinalProjectSubmission(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="final_project_submissions",
    )
    project = models.ForeignKey(
        FinalProject,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    project_title = models.CharField(max_length=200)
    description = models.TextField()
    source_code = models.TextField()
    is_completed = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["user", "project"]
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.user.email} - {self.project.title}"
    

class Certificate(models.Model):
    STATUS_VALID = "valid"
    STATUS_REVOKED = "revoked"

    STATUS_CHOICES = [
        (STATUS_VALID, "Valid"),
        (STATUS_REVOKED, "Revoked"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="certificate",
    )
    certificate_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    title = models.CharField(
        max_length=150,
        default="Verified Completion Certificate",
    )
    course_name = models.CharField(
        max_length=150,
        default="JavaScript Beginner to Intermediate",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_VALID,
    )
    issued_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoke_reason = models.TextField(blank=True)

    class Meta:
        ordering = ["-issued_at"]

    def __str__(self):
        return f"{self.user.email} - {self.certificate_id}"