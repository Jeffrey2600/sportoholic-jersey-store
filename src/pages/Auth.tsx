import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters"),
});

const signupSchema = loginSchema.extend({
  fullName: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  phoneNumber: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number (e.g., +1234567890)"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

type AuthMode = "login" | "signup" | "forgotPassword";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";
  const isForgotPassword = mode === "forgotPassword";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validated = z.string().trim().email("Invalid email").parse(email);
      const { error } = await supabase.auth.resetPasswordForEmail(validated, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent! Check your email.");
      setMode("login");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to send reset link");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const validatedData = loginSchema.parse({ email, password });
        const { error } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });
        if (error) throw error;
        toast.success("Logged in successfully!");
        navigate("/");
      } else {
        const validatedData = signupSchema.parse({ email, password, fullName, phoneNumber });
        const { error } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            data: {
              full_name: validatedData.fullName,
              phone_number: validatedData.phoneNumber,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("Account created successfully! Please check your email.");
        navigate("/");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card shadow-[var(--shadow-card)]">
        <CardHeader className="text-center space-y-2 sm:space-y-4">
          <img src={logo} alt="Sportoholic Logo" className="h-14 sm:h-16 w-auto mx-auto mb-2" />
          <CardTitle className="text-xl sm:text-2xl font-bold">
            {isForgotPassword ? "Reset Password" : isLogin ? "Welcome Back" : "Join Sportoholic"}
          </CardTitle>
          <CardDescription className="text-sm">
            {isForgotPassword
              ? "Enter your email to receive a password reset link"
              : isLogin
              ? "Enter your credentials to access your account"
              : "Create your account and get your favorite jerseys"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="bg-secondary/50 border-border"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-foreground text-background hover:bg-foreground/90"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full hover:bg-secondary/50"
                onClick={() => setMode("login")}
              >
                Back to Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                      placeholder="John Doe"
                      className="bg-secondary/50 border-border"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required={!isLogin}
                      placeholder="+1234567890"
                      className="bg-secondary/50 border-border"
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="bg-secondary/50 border-border"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  className="bg-secondary/50 border-border"
                />
              </div>

              {isLogin && (
                <div className="text-right -mt-2">
                  <Button
                    type="button"
                    variant="link"
                    className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
                    onClick={() => setMode("forgotPassword")}
                  >
                    Forgot Password?
                  </Button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-foreground text-background hover:bg-foreground/90"
                disabled={loading}
              >
                {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full hover:bg-secondary/50"
                onClick={() => setMode(isLogin ? "signup" : "login")}
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
