from django.urls import path
from learning.views import (
    certificate_view,
    complete_challenge_view,
    final_project_view,
    lesson_detail_view,
    lesson_list_view,
    progress_summary_view,
    public_certificate_verify_view,
)


urlpatterns = [
    path("lessons/", lesson_list_view),
    path("lessons/<slug:slug>/", lesson_detail_view),
    path("challenges/<int:challenge_id>/complete/", complete_challenge_view),
    path("progress-summary/", progress_summary_view),
    path("final-project/", final_project_view),
    path("certificate/", certificate_view),
    path(
    "certificates/verify/<uuid:certificate_id>/",
    public_certificate_verify_view,
),
]