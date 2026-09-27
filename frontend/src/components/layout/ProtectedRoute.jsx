import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

function ProtectedRoute({ children, requireAdmin = false }) {
    const { isAuthenticated, loading, initialized, isAdmin } = useAuthStore();

    if (!initialized || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Verifying session... </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !isAdmin()) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default ProtectedRoute;
