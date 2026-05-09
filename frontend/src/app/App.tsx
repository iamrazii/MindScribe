import React from "react";
import { motion } from "motion/react";
import { RouterProvider } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { LoginForm } from "./components/login-form";
import { createRouter } from "./routes";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Inner component has access to AuthContext
function AppInner() {
  const { user, login, logout } = useAuth();

  if (user) {
    const router = createRouter(user, logout);
    return (
      <React.Fragment>
        <RouterProvider router={router} />
        <Toaster />
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a8a9d] via-[#105a61] to-[#6b4423] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(72,229,229,0.15),transparent)] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-8 px-4 w-full">
          <div className="text-center space-y-3">
            <motion.h1
              className="text-6xl font-semibold tracking-tight"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.span
                className="inline-block bg-gradient-to-r from-[#48e5e5] via-[#a5f3f3] to-[#48e5e5] bg-clip-text text-transparent"
                animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% 200%" }}
              >
                Mindscribe
              </motion.span>
            </motion.h1>

            <motion.p
              className="text-xl text-cyan-100/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              AI-Powered Note Taker
            </motion.p>
          </div>

          <motion.div
            className="w-full flex justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <LoginForm onLoginSuccess={login} />
          </motion.div>
        </div>
      </div>
      <Toaster />
    </React.Fragment>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}