"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  registerSchema,
  registerOrgSchema,
  LoginFormValues,
  RegisterFormValues,
  RegisterOrgFormValues,
} from "@/lib/validations/auth";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/services/auth.service";
import { OrganizationService } from "@/lib/services/organization.service";
import Link from "next/link";
import DarkVeil from "@/app/(marketing)/DarkVeil";

const DEFAULT_CATEGORIES = [
  "Software Company",
  "Marketing Agency",
  "Design Studio",
  "Startup",
  "Enterprise",
  "Education",
  "Consulting",
  "Other",
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const toggleView = () => setIsLogin((prev) => !prev);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative text-white font-sans overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {/* <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0}
          warpAmount={0}
        /> */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[0px]"></div>
      </div>

      {/* Top Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-2 z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-extrabold text-xl tracking-wider text-white">
            SYNQ
          </span>
        </Link>
      </div>

      {/* Main Centered Container */}
      <div className="w-full max-w-[440px] bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        <div className="p-8 sm:p-10 relative flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <LoginForm key="login" toggleView={toggleView} />
            ) : (
              <RegisterWizard key="register" toggleView={toggleView} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer text */}
      <p className="mt-8 text-center text-sm text-slate-400 max-w-sm relative z-10">
        By continuing, you agree to SYNQ&apos;s{" "}
        <Link
          href="#"
          className="text-slate-300 underline underline-offset-4 hover:text-white transition-colors"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="#"
          className="text-slate-300 underline underline-offset-4 hover:text-white transition-colors"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────

function GoogleAuthButton({ actionText }: { actionText: string }) {
  return (
    <button
      type="button"
      onClick={() => AuthService.loginWithGoogle()}
      className="w-full py-2.5 rounded-md border border-white/10 bg-white/5 font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm text-white shadow-sm"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {actionText}
    </button>
  );
}

function Divider() {
  return (
    <div className="relative my-6 text-center">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/10"></div>
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-[#111] px-2 text-slate-400">
          or continue with email
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// LOGIN FORM
// ─────────────────────────────────────────────────────────

function LoginForm({ toggleView }: { toggleView: () => void }) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<"user" | "org">("user");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      const endpoint = loginMode === "org" ? "/auth/login-org" : "/auth/login";
      const res = await api.post(endpoint, data);
      
      const user = res.data.data.user;
      setUser(user);

      // Check if user is an Organization Founder (logged in via Workspace Login)
      const isFounder = user.organizations?.some((org: any) => org.orgId === user.id && org.role === 'admin');

      if (user.workspaces && user.workspaces.length > 0) {
        router.push(`/workspace/${user.workspaces[0].workspaceId}`);
      } else if (isFounder) {
        // Founder needs to create their first workspace
        router.push("/workspace/setup"); 
      } else {
        // Regular user needs an invite code
        router.push("/workspace/join");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message || "Login failed.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      <div className="flex flex-col space-y-2 text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="text-sm text-slate-400">
          Enter your email to sign in to your account
        </p>
      </div>

      {/* Segmented Control */}
      <div className="flex bg-white/5 p-1 rounded-lg mb-6 border border-white/10">
        <button
          type="button"
          onClick={() => { setLoginMode("user"); setError(null); }}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            loginMode === "user"
              ? "bg-white/10 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          User Login
        </button>
        <button
          type="button"
          onClick={() => { setLoginMode("org"); setError(null); }}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            loginMode === "org"
              ? "bg-white/10 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Workspace Login
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {loginMode === "user" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <GoogleAuthButton actionText="Sign in with Google" />
            <Divider />
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300">Email</label>
          <input
            {...register("email")}
            type="email"
            placeholder="name@example.com"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all placeholder:text-slate-500 text-sm text-white"
          />
          {errors.email && (
            <p className="text-red-400 text-xs">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 flex justify-between">
            <span>Password</span>
            <Link
              href="/forgot-password"
              className="font-normal text-slate-400 hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          </label>
          <input
            {...register("password")}
            type="password"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all text-sm text-white"
          />
          {errors.password && (
            <p className="text-red-400 text-xs">{errors.password.message}</p>
          )}
        </div>

        <button
          disabled={isSubmitting}
          className="w-full py-2.5 mt-2 rounded-md bg-white text-black font-medium hover:bg-slate-200 transition-colors shadow-sm text-sm"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <button
          onClick={toggleView}
          className="text-white hover:underline font-medium ml-1"
        >
          Sign up
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
// REGISTER WIZARD — mode selector (founder / member)
// ─────────────────────────────────────────────────────────

function RegisterWizard({ toggleView }: { toggleView: () => void }) {
  const [mode, setMode] = useState<"select" | "founder" | "member">("select");

  if (mode === "select") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full"
      >
        <div className="flex flex-col space-y-2 text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Create an account
          </h1>
          <p className="text-sm text-slate-400">
            How would you like to get started?
          </p>
        </div>

        <div className="space-y-3">
          {/* Founder path — creates a workspace */}
          <button
            onClick={() => setMode("founder")}
            className="w-full text-left p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:border-white/20 group"
          >
            <div className="flex items-start gap-4">
              <div className="mt-1 flex-shrink-0">
                <svg
                  width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white group-hover:text-blue-400 transition-colors"
                >
                  <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                  <path d="M9 22v-4h6v4" />
                  <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
                  <path d="M12 10h.01" /><path d="M12 14h.01" />
                  <path d="M16 10h.01" /><path d="M16 14h.01" />
                  <path d="M8 10h.01" /><path d="M8 14h.01" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">Register Team / Company</h4>
                <p className="text-xs text-slate-400 mt-1">I want to create a new workspace.</p>
              </div>
            </div>
          </button>

          {/* Member path — register account, join workspace later */}
          <button
            onClick={() => setMode("member")}
            className="w-full text-left p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:border-white/20 group"
          >
            <div className="flex items-start gap-4">
              <div className="mt-1 flex-shrink-0">
                <svg
                  width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white group-hover:text-purple-400 transition-colors"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8" /><path d="M8 12h8" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">Join an existing team</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Create an account and join a workspace with an invite code.
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <button
            onClick={toggleView}
            className="text-white hover:underline font-medium ml-1"
          >
            Sign in
          </button>
        </div>
      </motion.div>
    );
  }

  return mode === "founder" ? (
    <RegisterOrgForm onBack={() => setMode("select")} onComplete={toggleView} />
  ) : (
    <RegisterMemberForm onBack={() => setMode("select")} onComplete={toggleView} />
  );
}

// ─────────────────────────────────────────────────────────
// MEMBER: SIMPLE USER REGISTRATION (details only, no invite code)
// Invite code is entered AFTER login on /workspace/join
// ─────────────────────────────────────────────────────────

function RegisterMemberForm({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError(null);
      await api.post("/auth/register", data);
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message || "Registration failed.");
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full text-center py-4"
      >
        <div className="w-14 h-14 bg-green-500/15 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/25">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-white">Account Created!</h3>
        <p className="text-sm text-slate-400 mb-1">
          Your account is ready. Sign in and then enter your workspace invite code to get started.
        </p>
        <p className="text-xs text-slate-500 mb-6">
          You&apos;ll be asked for an invite code right after logging in.
        </p>
        <button
          onClick={onComplete}
          className="w-full py-2.5 rounded-md bg-white text-black font-medium text-sm hover:bg-slate-200 transition-colors"
        >
          Go to Sign In
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full"
    >
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-white">Create Account</h3>
          <p className="text-xs text-slate-400">Fill in your details to get started.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Full Name</label>
            <input
              {...register("name")}
              placeholder="John Doe"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm text-white placeholder:text-slate-600"
            />
            {errors.name && (
              <p className="text-red-400 text-xs">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Username</label>
            <input
              {...register("username")}
              placeholder="john_doe"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm text-white placeholder:text-slate-600"
            />
            {errors.username && (
              <p className="text-red-400 text-xs">{errors.username.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300">Email</label>
          <input
            {...register("email")}
            type="email"
            placeholder="name@example.com"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm text-white placeholder:text-slate-600"
          />
          {errors.email && (
            <p className="text-red-400 text-xs">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300">Password</label>
          <input
            {...register("password")}
            type="password"
            placeholder="Min 8 chars, upper + lower + digit"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm text-white placeholder:text-slate-600"
          />
          {errors.password && (
            <p className="text-red-400 text-xs">{errors.password.message}</p>
          )}
        </div>

        <p className="text-xs text-slate-500 pt-1">
          After signing in you&apos;ll be asked for a workspace invite code.
        </p>

        <button
          disabled={isSubmitting}
          className="w-full py-2.5 mt-2 rounded-md bg-white text-black font-medium text-sm hover:bg-slate-200 transition-colors shadow-sm"
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
// FOUNDER: ORGANIZATION REGISTRATION (org is a separate entity)
// Uses registerOrgSchema — completely independent from user registration
// ─────────────────────────────────────────────────────────

function RegisterOrgForm({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterOrgFormValues>({
    resolver: zodResolver(registerOrgSchema),
    defaultValues: {
      category: DEFAULT_CATEGORIES[0],
      roles: ["Admin", "Member"],
    },
  });

  const {
    fields: roleFields,
    append: appendRole,
    remove: removeRole,
  } = useFieldArray({
    control,
    name: "roles" as never,
  });

  const onSubmit = async (data: RegisterOrgFormValues) => {
    try {
      setError(null);
      await OrganizationService.registerOrganization(data as never);
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message || "Organization registration failed.");
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full text-center py-4"
      >
        <div className="w-14 h-14 bg-green-500/15 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/25">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-white">Workspace Created!</h3>
        <p className="text-sm text-slate-400 mb-6">
          Your workspace has been successfully registered.
        </p>
        <button
          onClick={onComplete}
          className="w-full py-2.5 rounded-md bg-white text-black font-medium text-sm hover:bg-slate-200 transition-colors"
        >
          Go to Sign In
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full flex-1 overflow-y-auto max-h-[70vh] custom-scrollbar pr-2 -mr-2"
    >
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-white">Register Workspace</h3>
          <p className="text-xs text-slate-400">Set up a new workspace for your team.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300">Company Name</label>
          <input
            {...register("name")}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all text-sm text-white"
            placeholder="Acme Corp"
          />
          {errors.name && (
            <p className="text-red-400 text-xs">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300">Organization Email</label>
          <input
            {...register("email")}
            type="email"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all text-sm text-white"
            placeholder="contact@acme.com"
          />
          {errors.email && (
            <p className="text-red-400 text-xs">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300">Organization Password</label>
          <input
            {...register("password")}
            type="password"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all text-sm text-white"
          />
          {errors.password && (
            <p className="text-red-400 text-xs">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300">Category</label>
          <select
            {...register("category")}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all text-sm text-white [&>option]:bg-slate-900"
          >
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="Custom">Custom / Other</option>
          </select>
        </div>

        <div className="pt-2 border-t border-white/10">
          <label className="text-sm font-medium text-slate-300 mb-2 block">Define Roles</label>
          <div className="space-y-2 mb-2">
            {roleFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <input
                  {...register(`roles.${index}` as const)}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => removeRole(index)}
                  className="px-3 py-2 border border-white/10 text-slate-400 rounded-md hover:bg-white/10 hover:text-red-400 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendRole("")}
            className="text-xs font-medium text-white hover:underline flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="M12 5v14" />
            </svg>
            Add role
          </button>
        </div>

        <button
          disabled={isSubmitting}
          className="w-full py-2.5 mt-4 rounded-md bg-white text-black font-medium text-sm hover:bg-slate-200 transition-colors shadow-sm disabled:opacity-60"
        >
          {isSubmitting ? "Registering..." : "Register Workspace"}
        </button>
      </form>
    </motion.div>
    );
}
