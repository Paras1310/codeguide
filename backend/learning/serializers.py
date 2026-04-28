from rest_framework import serializers

from learning.models import Challenge, ChallengeHint, ChallengeTestCase, Lesson, UserChallengeProgress


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
        user = self.context["request"].user

        return obj.user_progress.filter(
            user=user,
            is_passed=True,
        ).exists()

    def get_attempts(self, obj):
        user = self.context["request"].user

        progress = obj.user_progress.filter(user=user).first()

        if progress is None:
            return 0

        return progress.attempts


class LessonListSerializer(serializers.ModelSerializer):
    challenge_count = serializers.SerializerMethodField()
    passed_challenge_count = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
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
            "challenge_count",
            "passed_challenge_count",
            "progress_percent",
            "is_completed",
        ]

    def get_challenge_count(self, obj):
        return obj.challenges.filter(is_required=True).count()

    def get_passed_challenge_count(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return 0

        return UserChallengeProgress.objects.filter(
            user=request.user,
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
        total = self.get_challenge_count(obj)

        if total == 0:
            return False

        passed = self.get_passed_challenge_count(obj)
        return passed == total


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
        challenges = obj.challenges.all()

        return ChallengeSerializer(
            challenges,
            many=True,
            context=self.context,
        ).data

    def get_is_completed(self, obj):
        user = self.context["request"].user

        return obj.user_progress.filter(
            user=user,
            is_completed=True,
        ).exists()