import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import type { AuthUser } from "../context/AuthContext";

interface Props {
  onLoginSuccess: (user: AuthUser) => void;
}

export function LoginForm({ onLoginSuccess }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<{ email: string; password: string }>();
  const signupForm = useForm<{ username: string; email: string; password: string }>();

  // ── Login ──────────────────────────────────────────────────────────────────
  const onLogin = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ email: data.email, password: data.password });
      toast.success("Welcome back!");
      onLoginSuccess(res as AuthUser);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Signup ─────────────────────────────────────────────────────────────────
  const onSignup = async (data: { username: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register({
        username: data.username,
        email: data.email,
        password: data.password,
      });
      toast.success("Account created! Welcome to Mindscribe.");
      onLoginSuccess(res as AuthUser);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px]">
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="flex w-full flex-row rounded-2xl bg-white/10 p-1 backdrop-blur-md border border-white/20">
          <TabsTrigger
            value="login"
            className="flex-1 rounded-xl py-2 text-white/60 font-medium transition-all data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-sm"
          >
            Login
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="flex-1 rounded-xl py-2 text-white/60 font-medium transition-all data-[state=active]:bg-white/25 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-sm"
          >
            Sign Up
          </TabsTrigger>
        </TabsList>

        {/* ── Login Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="login" className="mt-6">
          <Card className="overflow-hidden border border-white/20 bg-white/15 backdrop-blur-xl shadow-2xl rounded-[2.5rem] p-4">
            <form onSubmit={loginForm.handleSubmit(onLogin)}>
              <CardContent className="space-y-6 pt-8 text-white">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-bold text-white">
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/50 px-4 focus:ring-2 focus:ring-[#2dd4bf]"
                    {...loginForm.register("email", { required: "Email is required" })}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-red-500">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-bold text-white">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="h-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/50 px-4 pr-12 focus:ring-2 focus:ring-[#2dd4bf]"
                      {...loginForm.register("password", { required: "Password is required" })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pb-8 pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-full rounded-2xl bg-[#0a0a0b] text-lg font-semibold text-white hover:bg-black transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 animate-spin" /> : "Login"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* ── Signup Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="signup" className="mt-6">
          <Card className="border border-white/20 bg-white/15 backdrop-blur-xl shadow-2xl rounded-[2.5rem] p-4">
            <form onSubmit={signupForm.handleSubmit(onSignup)}>
              <CardContent className="space-y-4 pt-8 text-white">
                <div className="space-y-1">
                  <Label className="text-sm font-bold text-white">Username</Label>
                  <Input
                    placeholder="john_doe"
                    className="h-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/50"
                    {...signupForm.register("username", { required: "Username is required" })}
                  />
                  {signupForm.formState.errors.username && (
                    <p className="text-xs text-red-500">{signupForm.formState.errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-bold text-white">Email</Label>
                  <Input
                    placeholder="you@example.com"
                    type="email"
                    className="h-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/50"
                    {...signupForm.register("email", { required: "Email is required" })}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-xs text-red-500">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-bold text-white">Password</Label>
                  <Input
                    type="password"
                    placeholder="Create a password"
                    className="h-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/50"
                    {...signupForm.register("password", { required: "Password is required" })}
                  />
                  <PasswordStrength password={signupForm.watch("password") || ""} />
                  {signupForm.formState.errors.password && (
                    <p className="text-xs text-red-500">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pb-8 pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-full rounded-2xl bg-[#0a0a0b] text-lg font-semibold text-white"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 animate-spin" /> : "Sign Up"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const requirements = [
    { label: "8+ chars", met: checks.minLength },
    { label: "Uppercase", met: checks.hasUpperCase },
    { label: "Number", met: checks.hasNumber },
    { label: "Special", met: checks.hasSpecialChar },
  ];
  return (
    <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 text-[10px]">
      {requirements.map((req) => (
        <div
          key={req.label}
          className={`flex items-center gap-1 ${req.met ? "text-green-600" : "text-gray-400"}`}
        >
          <span className="text-xs">{req.met ? "✓" : "○"}</span>
          <span className="font-medium uppercase tracking-wider">{req.label}</span>
        </div>
      ))}
    </div>
  );
}