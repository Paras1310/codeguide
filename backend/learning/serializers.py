from rest_framework import serializers

from learning.models import (
    Challenge,
    ChallengeHint,
    ChallengeTestCase,
    Lesson,
    UserChallengeProgress,
    UserLessonProgress,
)


def get_request_user(context):
    request = context.get("request")

    if request is None or not request.user.is_authenticated:
        return None

    return request.user


def get_previous_published_lesson(lesson):
    return (
        Lesson.objects.filter(is_published=True, order__lt=lesson.order)
        .order_by("-order")
        .first()
    )


def is_lesson_completed_by_user(user, lesson):
    if lesson is None:
        return True

    return UserLessonProgress.objects.filter(
        user=user,
        lesson=lesson,
        is_completed=True,
    ).exists()


class ChallengeHintSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeHint
        fields = [
            "id",
            "text",
            "order",
        ]


class ChallengeTestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeTestCase
        fields = [
            "id",
            "name",
            "function_name",
            "input_data",
            "expected_output",
            "order",
        ]


class ChallengeSerializer(serializers.ModelSerializer):
    test_cases = ChallengeTestCaseSerializer(many=True, read_only=True)
    hints = ChallengeHintSerializer(many=True, read_only=True)
    is_passed = serializers.SerializerMethodField()
    attempts = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = [
            "id",
            "title",
            "challenge_type",
            "instructions",
            "starter_code",
            "order",
            "is_required",
            "test_cases",
            "hints",
            "is_passed",
            "attempts",
        ]

    def get_is_passed(self, obj):
        user = get_request_user(self.context)

        if user is None:
            return False

        return obj.user_progress.filter(
            user=user,
            is_passed=True,
        ).exists()

    def get_attempts(self, obj):
        user = get_request_user(self.context)

        if user is None:
            return 0

        progress = obj.user_progress.filter(user=user).first()

        if progress is None:
            return 0

        return progress.attempts


class LessonListSerializer(serializers.ModelSerializer):
    challenge_count = serializers.SerializerMethodField()
    passed_challenge_count = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()
    previous_lesson_title = serializers.SerializerMethodField()
    unlock_message = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "id",
            "title",
            "slug",
            "order",
            "level",
            "concept",
            "challenge_count",
            "passed_challenge_count",
            "progress_percent",
            "is_completed",
            "is_locked",
            "previous_lesson_title",
            "unlock_message",
        ]

    def get_challenge_count(self, obj):
        return obj.challenges.filter(is_required=True).count()

    def get_passed_challenge_count(self, obj):
        user = get_request_user(self.context)

        if user is None:
            return 0

        return UserChallengeProgress.objects.filter(
            user=user,
            challenge__lesson=obj,
            challenge__is_required=True,
            is_passed=True,
        ).count()

    def get_progress_percent(self, obj):
        total = self.get_challenge_count(obj)

        if total == 0:
            return 0

        passed = self.get_passed_challenge_count(obj)

        return round((passed / total) * 100)

    def get_is_completed(self, obj):
        user = get_request_user(self.context)

        if user is None:
            return False

        progress_completed = UserLessonProgress.objects.filter(
            user=user,
            lesson=obj,
            is_completed=True,
        ).exists()

        if progress_completed:
            return True

        total = self.get_challenge_count(obj)

        if total == 0:
            return False

        passed = self.get_passed_challenge_count(obj)

        return passed == total

    def get_is_locked(self, obj):
        previous_lesson = get_previous_published_lesson(obj)

        if previous_lesson is None:
            return False

        user = get_request_user(self.context)

        if user is None:
            return True

        return not is_lesson_completed_by_user(user, previous_lesson)

    def get_previous_lesson_title(self, obj):
        previous_lesson = get_previous_published_lesson(obj)

        if previous_lesson is None:
            return None

        return previous_lesson.title

    def get_unlock_message(self, obj):
        previous_lesson = get_previous_published_lesson(obj)

        if previous_lesson is None:
            return "This is the first lesson."

        if not self.get_is_locked(obj):
            return "Lesson unlocked."

        return f"Complete '{previous_lesson.title}' to unlock this lesson."


class LessonDetailSerializer(serializers.ModelSerializer):
    challenges = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "id",
            "title",
            "slug",
            "order",
            "level",
            "concept",
            "explanation",
            "syntax",
            "example",
            "common_mistakes",
            "recap",
            "is_completed",
            "challenges",
        ]

    def get_challenges(self, obj):
        challenges = obj.challenges.all().order_by("order")

        return ChallengeSerializer(
            challenges,
            many=True,
            context=self.context,
        ).data

    def get_is_completed(self, obj):
        user = get_request_user(self.context)

        if user is None:
            return False

        return obj.user_progress.filter(
            user=user,
            is_completed=True,
        ).exists()