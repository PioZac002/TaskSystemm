import { useAuth } from '@/hooks/useAuth';

function App() {
    const { user, isAuthenticated, setAuth, logout } = useAuth();

    return (
        <div className="p-10">
            <h1 className="font-bold text-2xl mb-6">Test AuthStore Zustand + useAuth</h1>

            {isAuthenticated ? (
                <div>
                    <p className="mb-4">Witaj, {user?.firstName} {user?.lastName}!</p>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                        onClick={logout}
                    >
                        Wyloguj się
                    </button>
                </div>
            ) : (
                <button
                    className="bg-green-600 text-white px-4 py-2 rounded"
                    onClick={() =>
                        setAuth(
                            { firstName: "Jan", lastName: "Kowalski", email: "jan@nowy.pl" },
                            "mock-access-token"
                        )
                    }
                >
                    Zaloguj przykładowego usera
                </button>
            )}
        </div>
    );
}
export default App;
