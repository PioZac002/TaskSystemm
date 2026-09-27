import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Mail, Lock, User, UserCheck, Hash } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { AuthCard, AuthSubmitButton, LabelInputContainer } from "./AuthFormShell";

export default function RegisterForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const setAuth = useAuthStore((state) => state.setAuth);
    const cardRef = useRef(null);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [slackUserId, setSlackUserId] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fromLogin = location.state?.from === "login";
        gsap.fromTo(
            cardRef.current,
            { opacity: 0, x: fromLogin ? 60 : 0, y: fromLogin ? 0 : 30, scale: 0.97 },
            { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.45, ease: "power3.out" }
        );
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            toast.error("Fill in all required fields");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords don't match!");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const finalSlackUserId = slackUserId.trim() || `U${Date.now()}`;
            const data = await authService.register({
                firstName,
                lastName,
                email,
                password,
                slackUserId: finalSlackUserId,
            });

            if (data.user) {
                setAuth(data.user, data.accessToken);
                toast.success("Account created successfully!");
                navigate("/dashboard");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.Message || err.message || "Registration failed";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoToLogin = () => {
        gsap.to(cardRef.current, {
            opacity: 0,
            x: 60,
            scale: 0.97,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => navigate("/login", { state: { from: "register" } }),
        });
    };

    return (
        <AuthCard
            ref={cardRef}
            title="Create Account"
            description="Start managing your work with the same TaskSystem account flow."
            wide
        >
            <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                    <LabelInputContainer>
                        <Label htmlFor="firstName">
                            First Name <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="John"
                                className="h-11 pl-10 shadow-input"
                                disabled={loading}
                                required
                            />
                        </div>
                    </LabelInputContainer>

                    <LabelInputContainer>
                        <Label htmlFor="lastName">
                            Last Name <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <UserCheck className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Doe"
                                className="h-11 pl-10 shadow-input"
                                disabled={loading}
                                required
                            />
                        </div>
                    </LabelInputContainer>
                </div>

                <LabelInputContainer>
                    <Label htmlFor="email">
                        Email Address <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="h-11 pl-10 shadow-input"
                            disabled={loading}
                            required
                        />
                    </div>
                </LabelInputContainer>

                <LabelInputContainer>
                    <Label htmlFor="slackUserId">
                        Slack User ID <span className="text-xs text-muted-foreground">(optional)</span>
                    </Label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="slackUserId"
                            type="text"
                            value={slackUserId}
                            onChange={(e) => setSlackUserId(e.target.value)}
                            placeholder="U123456"
                            className="h-11 pl-10 shadow-input"
                            disabled={loading}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Leave empty to auto-generate</p>
                </LabelInputContainer>

                <div className="grid gap-4 md:grid-cols-2">
                    <LabelInputContainer>
                        <Label htmlFor="password">
                            Password <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="h-11 pl-10 shadow-input"
                                disabled={loading}
                                required
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                    </LabelInputContainer>

                    <LabelInputContainer>
                        <Label htmlFor="confirmPassword">
                            Confirm Password <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Password"
                                className="h-11 pl-10 shadow-input"
                                disabled={loading}
                                required
                            />
                        </div>
                    </LabelInputContainer>
                </div>

                <AuthSubmitButton disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                </AuthSubmitButton>

                <div className="pt-2 text-center text-sm">
                    <span className="text-muted-foreground">Already have an account? </span>
                    <button
                        type="button"
                        onClick={handleGoToLogin}
                        className="font-semibold text-primary hover:underline"
                    >
                        Sign in
                    </button>
                </div>
            </form>
        </AuthCard>
    );
}
