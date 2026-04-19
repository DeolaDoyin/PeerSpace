import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axios";
import FloatingInput from "@/components/FloatingInput";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Sun, Moon } from "lucide-react";
import AppHeader from "@/components/AppHeader";

// Moved SocialButton up or defined it clearly so it's recognized
const SocialButton = ({ icon }: { icon: string }) => (
  <button className="p-3 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border">
    {/* SVG icons would go here based on the 'icon' prop */}
    <span className="sr-only">Sign in with {icon}</span>
    {icon === "google" && "G"}
    {icon === "facebook" && "F"}
    {icon === "apple" && "A"}
  </button>
);

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAlias, setIsLoadingAlias] = useState(false);

  // --- Theme Logic ---
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  };

  const fetchSuggestion = async () => {
    setIsLoadingAlias(true);
    try {
      const { data } = await api.get("/api/auth/suggest-username");
      setUsername(data);
    } catch (e) {
      console.error("Failed to fetch username suggestion");
    } finally {
      setIsLoadingAlias(false);
    }
  };

  useEffect(() => {
    if (!isLogin && !username) {
      fetchSuggestion();
    }
  }, [isLogin]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = "Username is required";
    if (!isLogin && !email.includes("@")) newErrors.email = "Valid email required";
    if (!password || password.length < 8) newErrors.password = "Min 8 characters";
    if (!isLogin && password !== confirmPassword) newErrors.confirmPassword = "Passwords match error";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const endpoint = isLogin ? "/api/login" : "/api/register";
      const payload = isLogin 
        ? { login: username, password } 
        : { name: username, email, password, password_confirmation: confirmPassword };
      
      await api.get("/sanctum/csrf-cookie");
      const response = await api.post(endpoint, payload);
      localStorage.setItem("token", response.data.token);
      navigate("/Forum");
    } catch (err: any) {
      setErrors({ general: err.response?.data?.message || "Authentication failed" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300 relative">
      <AppHeader />
      
      {/* Theme Toggle Button */}
      <div className="absolute top-20 right-6 z-50">
        <button
          onClick={toggleTheme}
          type="button"
          className="p-3 rounded-xl bg-muted hover:bg-accent text-foreground transition-all border border-border shadow-sm"
          aria-label="Toggle Theme"
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-md w-full mx-auto space-y-8">
          {/* Logo area */}
          <div className="text-center space-y-2">
            <a href="/">
              <h1 className="text-3xl font-bold text-foreground">PeerSpace</h1>
            </a>
            <p className="text-muted-foreground">
              Anonymous peer support for students
            </p>
          </div>

          {errors.general && (
            <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <FloatingInput
                label={isLogin ? "Username or Email" : "Choose your anonymous identity"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={errors.username || errors.login}
                autoComplete="username"
                rightElement={
                  !isLogin && (
                    <button
                      type="button"
                      onClick={fetchSuggestion}
                      className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                    >
                      <RefreshCw size={18} className={isLoadingAlias ? "animate-spin" : ""} />
                    </button>
                  )
                }
              />
              {!isLogin && (
                <p className="text-xs text-muted-foreground px-1">
                  This is how others will see you in PeerSpace.
                </p>
              )}
            </div>

            {!isLogin && (
              <FloatingInput
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                autoComplete="email"
              />
            )}

            <FloatingInput
              label="Enter Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />

            {!isLogin && (
              <FloatingInput
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
              </button>
            </div>

            <Button type="submit" className="w-full h-12 text-base rounded-xl" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isLogin ? "Login" : "Sign Up")}
            </Button>
          </form>

          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">Or sign up with</div>
            <div className="flex justify-center gap-6">
              <SocialButton icon="google" />
              <SocialButton icon="facebook" />
              <SocialButton icon="apple" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;