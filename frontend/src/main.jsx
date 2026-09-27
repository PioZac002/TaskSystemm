import "@/index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "@/store/authStore";
import "@fontsource/pixelify-sans/500.css";
import "@fontsource/pixelify-sans/700.css";
import "@fontsource/silkscreen/400.css";
import "@fontsource/silkscreen/700.css";

// Importy podstron
import LandingPage from "@/features/landing/LandingPage";
import NotFound from "@/features/NotFound";
import Dashboard from "@/features/dashboard/Dashboard";
import Board from "@/features/boards/Board";
import Projects from "@/features/projects/Projects";
import Issues from "@/features/issues/Issues";
import Profile from "@/features/profile/Profile.jsx";
import LoginForm from "@/features/auth/LoginForm";
import RegisterForm from "@/features/auth/RegisterForm";
import UserManagement from "@/features/users/UserManagement";
import TeamManagement from "@/features/teams/TeamManagement";
import ProjectDetailPage from "@/features/projects/ProjectDetailPage";
import IssueDetailPage from "@/features/issues/IssueDetailPage";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import LabelsManagement from "@/features/labels/LabelsManagement";

// Komponent App z inicjalizacją auth
function App() {
    const { initialize, loading, initialized } = useAuthStore();

    React.useEffect(() => {
        if (!initialized) {
            initialize();
        }
    }, [initialized, initialize]);

    // Pokaż loader podczas inicjalizacji
    if (! initialized || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Initializing...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Toaster position="top-right" richColors />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/board" element={<ProtectedRoute><Board /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
                <Route path="/issues" element={<ProtectedRoute><Issues /></ProtectedRoute>} />
                <Route path="/issues/:id" element={<ProtectedRoute><IssueDetailPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute requireAdmin><UserManagement /></ProtectedRoute>} />
                <Route path="/labels" element={<ProtectedRoute requireAdmin><LabelsManagement /></ProtectedRoute>} />
                <Route path="/teams" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
