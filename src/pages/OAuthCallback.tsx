import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Loader2, AlertCircle } from "lucide-react";
import { authApi } from "@/services/authApi";
import { useAuth } from "@/hooks/useAuth";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");

      if (!accessToken || !refreshToken) {
        setError("Invalid authentication response");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      try {
        // Store tokens and fetch user data
        await authApi.handleOAuthCallback(accessToken, refreshToken);
        
        // Refresh user data in auth context
        await refreshUser();
        
        // Redirect to dashboard
        navigate("/dashboard");
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError("Authentication failed. Redirecting to login...");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {error ? (
                <AlertCircle className="w-8 h-8 text-destructive" />
              ) : (
                <Globe className="w-8 h-8 text-primary animate-pulse" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {error ? "Authentication Failed" : "Completing Sign In"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {error ? (
            <p className="text-sm text-muted-foreground text-center">{error}</p>
          ) : (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we complete your sign in...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;

