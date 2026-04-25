import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
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

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("oauth_token=")) {
      const token = hash.split("oauth_token=")[1];
      localStorage.setItem("token", token);
      window.location.hash = "";
      navigate("/forum");
    } else if (location.search.includes("error=oauth_failed")) {
      setErrors({ general: "Social authentication failed or is unconfigured. Please try again." });
    }
  }, [navigate, location]);

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
      // Catch Errors
      if (err.response?.status === 422) {
        // Handle validation errors
        const serverErrors: any = {};
        Object.keys(err.response.data.errors).forEach((key) => {
          serverErrors[key === "name" ? "username" : key] =
            err.response.data.errors[key][0];
        });
        setErrors(serverErrors);
      } else if (err.response?.status === 401) {
        // Handle incorrect login credentials
        setErrors({ general: "Invalid username or password." });
      } else {
        // Handle network errors, 500 server errors, etc.
        setErrors({ general: "Something went wrong. Please try again later." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: string) => {
    try {
      setIsLoading(true);
      // Calls the hypothetical backend socialite endpoint
      const res = await api.get(`/api/auth/${provider}/redirect`);
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (e: any) {
      setErrors({ general: `${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not currently configured by the admin.` });
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
                onClick={() => {
                setIsLogin(!isLogin);
                setUsername("");
                setPassword("");
                setConfirmPassword("");
                setErrors({});
              }}
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
          <div className="text-center text-sm text-muted-foreground">
            Or sign up with
          </div>

          <div className="flex justify-center gap-6">
            <button type="button" onClick={() => handleOAuth('google')} className="p-3 rounded-full hover:bg-muted transition-colors">
              <svg className="h-7 w-7" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </button>

            <button type="button" onClick={() => handleOAuth('facebook')} className="p-3 rounded-full hover:bg-muted transition-colors">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>

            <button type="button" onClick={() => handleOAuth('apple')} className="p-3 rounded-full hover:bg-muted transition-colors">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Auth;