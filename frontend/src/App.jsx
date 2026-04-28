import { Navigate, Route, Routes } from "react-router-dom";

import { getSavedUser } from "./auth/tokenStorage";
import UserHeader from "./components/layout/UserHeader";

import CertificatePage from "./pages/user/CertificatePage";
import CertificatePrintPage from "./pages/user/CertificatePrintPage";
import DashboardPage from "./pages/user/DashboardPage";
import FinalProjectPage from "./pages/user/FinalProjectPage";
import LearningPathPage from "./pages/user/LearningPathPage";
import LessonDetailPage from "./pages/user/LessonDetailPage";
import LoginPage from "./pages/user/LoginPage";
import RegisterPage from "./pages/user/RegisterPage";
import VerifyCertificatePage from "./pages/user/VerifyCertificatePage";

function ProtectedRoute({ children }) {
  const isLoggedIn = Boolean(getSavedUser());

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function ProtectedUserPage({ children }) {
  return (
    <ProtectedRoute>
      <UserHeader />
      {children}
    </ProtectedRoute>
  );
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
          <ProtectedUserPage>
            <DashboardPage />
          </ProtectedUserPage>
        }
      />

      <Route
        path="/learn"
        element={
          <ProtectedUserPage>
            <LearningPathPage />
          </ProtectedUserPage>
        }
      />

      <Route
        path="/learn/:slug"
        element={
          <ProtectedUserPage>
            <LessonDetailPage />
          </ProtectedUserPage>
        }
      />

      <Route
        path="/final-project"
        element={
          <ProtectedUserPage>
            <FinalProjectPage />
          </ProtectedUserPage>
        }
      />

      <Route
        path="/certificate"
        element={
          <ProtectedUserPage>
            <CertificatePage />
          </ProtectedUserPage>
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
        path="/verify/:certificateId"
        element={<VerifyCertificatePage />}
      />

      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}

export default App;