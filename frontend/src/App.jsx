import { Navigate, Route, Routes } from "react-router-dom";

import { getSavedUser } from "./auth/tokenStorage";
import DashboardPage from "./pages/user/DashboardPage";
import LearningPathPage from "./pages/user/LearningPathPage";
import LessonDetailPage from "./pages/user/LessonDetailPage";
import LoginPage from "./pages/user/LoginPage";
import RegisterPage from "./pages/user/RegisterPage";
import FinalProjectPage from "./pages/user/FinalProjectPage";
import CertificatePage from "./pages/user/CertificatePage";
import VerifyCertificatePage from "./pages/user/VerifyCertificatePage";
import CertificatePrintPage from "./pages/user/CertificatePrintPage";

function ProtectedRoute({ children }) {
  const isLoggedIn = Boolean(getSavedUser());

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/register" replace />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/verify/:certificateId"
        element={<VerifyCertificatePage />}
      />

      <Route
        path="/certificate"
        element={
          <ProtectedRoute>
            <CertificatePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/certificate/print"
        element={
          <ProtectedRoute>
            <CertificatePrintPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/learn"
        element={
          <ProtectedRoute>
            <LearningPathPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/final-project"
        element={
          <ProtectedRoute>
            <FinalProjectPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/learn/:slug"
        element={
          <ProtectedRoute>
            <LessonDetailPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}

export default App;
