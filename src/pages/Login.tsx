import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const oauthError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => alert("Google login coming soon!");
  const handleWeChatLogin = () => alert("WeChat login coming soon!");

  return (
    <div className="min-h-screen bg-background flex">

      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-card border-r border-border relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 39px,
              hsl(var(--border)) 39px,
              hsl(var(--border)) 40px
            ), repeating-linear-gradient(
              90deg,
              transparent,
              transparent 39px,
              hsl(var(--border)) 39px,
              hsl(var(--border)) 40px
            )`,
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
              <span className="font-display text-sm font-800 text-primary-foreground">G</span>
            </div>
            <div>
              <p className="font-display text-sm font-700 tracking-[0.1em] uppercase text-foreground leading-none">Global Trade</p>
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-muted-foreground leading-none mt-0.5">Hub</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <div className="w-10 h-px bg-primary" />
          <blockquote className="space-y-3">
            <p className="font-display text-2xl font-600 text-foreground leading-snug">
              Source smarter.<br />Trade globally.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Connect with verified manufacturers, run AI-powered sourcing, and manage your entire import workflow in one place.
            </p>
          </blockquote>

          <div className="flex gap-8 pt-2">
            {[
              { label: "Manufacturers", value: "12K+" },
              { label: "Products", value: "80K+" },
              { label: "Countries", value: "60+" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-xl font-700 text-primary tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground font-display tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative font-display text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
          © 2026 Global Trade Hub
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-up">

          {/* Mobile brand */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-7 h-7 bg-primary rounded-sm flex items-center justify-center">
              <span className="font-display text-xs font-800 text-primary-foreground">G</span>
            </div>
            <p className="font-display text-sm font-700 tracking-[0.1em] uppercase text-foreground">Global Trade Hub</p>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-2xl font-700 text-foreground mb-1.5">Sign in</h1>
            <p className="text-sm text-muted-foreground">Access your trade management platform</p>
          </div>

          {(error || oauthError) && (
            <div className="flex items-start gap-2.5 p-3 mb-5 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{oauthError === "auth_failed" ? "Authentication failed. Please try again." : error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-display text-xs tracking-wide uppercase text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-10 bg-card border-border focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-display text-xs tracking-wide uppercase text-muted-foreground">
                  Password
                </Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 bg-card border-border focus:border-primary transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 font-display tracking-wide gap-2"
              disabled={loading}
            >
              {loading ? "Signing in…" : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="font-display text-[10px] tracking-[0.2em] uppercase text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 h-10 rounded-md border border-border bg-card text-sm text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-display text-xs tracking-wide">Google</span>
            </button>
            <button
              type="button"
              onClick={handleWeChatLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 h-10 rounded-md border border-border bg-card text-sm text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.406-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
              </svg>
              <span className="font-display text-xs tracking-wide">WeChat</span>
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            No account?{" "}
            <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
