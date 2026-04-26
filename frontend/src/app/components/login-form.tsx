import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardFooter } from "./ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

export function LoginForm({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm();
  const signupForm = useForm();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    };
  };

  const onSignup = async (data) => {
    if (!validateEmail(data.email)) {
      signupForm.setError("email", { message: "Please enter a valid email address" });
      return;
    }
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      signupForm.setError("password", { message: "Password does not meet requirements" });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({ name: data.name, email: data.email });
    }, 1000);
  };

  return (
    <div className="w-full max-w-[420px]">
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-black/20 p-1 backdrop-blur-md">
          <TabsTrigger
            value="login"
            className="rounded-xl py-2 text-gray-200 data-[state=active]:bg-white data-[state=active]:text-black transition-all"
          >
            Login
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="rounded-xl py-2 text-gray-200 data-[state=active]:bg-white data-[state=active]:text-black transition-all"
          >
            Sign Up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="mt-6">
          <Card className="overflow-hidden border-none bg-white shadow-2xl rounded-[2.5rem] p-4">
            <CardContent className="space-y-6 pt-8">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-bold text-gray-700">
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 rounded-xl border-none bg-gray-50 px-4 focus:ring-2 focus:ring-[#1a8a9d]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" title="Password" className="text-sm font-bold text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-12 rounded-xl border-none bg-gray-50 px-4 pr-12 focus:ring-2 focus:ring-[#1a8a9d]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-8 pt-4">
              <Button
                variant="default"
                size="lg"
                type="button"
                className="h-14 w-full rounded-2xl bg-[#0a0a0b] text-lg font-semibold text-white hover:bg-black transition-all"
                onClick={() => onLoginSuccess({ name: "User", email: "user@mindscribe.com" })}
              >
                Login
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="signup" className="mt-6">
          <Card className="border-none bg-white shadow-2xl rounded-[2.5rem] p-4">
            <form onSubmit={signupForm.handleSubmit(onSignup)}>
              <CardContent className="space-y-4 pt-8">
                <div className="space-y-1">
                  <Label className="text-sm font-bold text-gray-700">Full Name</Label>
                  <Input
                    placeholder="John Doe"
                    className="h-12 rounded-xl border-none bg-gray-50"
                    {...signupForm.register("name", { required: "Name is required" })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-bold text-gray-700">Email</Label>
                  <Input
                    placeholder="you@example.com"
                    className="h-12 rounded-xl border-none bg-gray-50"
                    {...signupForm.register("email", { required: "Email is required" })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-bold text-gray-700">Password</Label>
                  <Input
                    type="password"
                    placeholder="Create a password"
                    className="h-12 rounded-xl border-none bg-gray-50"
                    {...signupForm.register("password", { required: "Password is required" })}
                  />
                  <PasswordStrength password={signupForm.watch("password") || ""} />
                </div>
              </CardContent>
              <CardFooter className="pb-8 pt-4">
                <Button
                  variant="default"
                  size="lg"
                  type="submit"
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

function PasswordStrength({ password }) {
  if (!password) return null;
  const validation = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const requirements = [
    { label: "8+ chars", met: validation.minLength },
    { label: "Uppercase", met: validation.hasUpperCase },
    { label: "Number", met: validation.hasNumber },
    { label: "Special", met: validation.hasSpecialChar },
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