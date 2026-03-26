"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordFormValues } from "@/lib/validations/auth";
import { api } from "@/lib/api";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      setError(null);
      await api.post(`/auth/reset-password/${token}`, {
        newPassword: data.password
      });
      setIsSubmitted(true);
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Invalid or expired token. Please request a new link.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative text-white font-sans overflow-hidden bg-black">
      {/* Background decoration */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/5 blur-[120px] pointer-events-none"></div>
      
      {/* Top Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-2 z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-extrabold text-xl tracking-wider text-white">
            SYNQ
          </span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[440px] bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        <div className="p-8 sm:p-10">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center">
                  <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center justify-center gap-2">
                    <ShieldCheck className="w-6 h-6" /> Reset Password
                  </h1>
                  <p className="text-sm text-slate-400">
                    Set a secure new password for your account.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm">
                      {error}
                      <div className="mt-2">
                        <Link href="/forgot-password" className="text-white hover:underline text-xs">
                          Request a new link
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">New Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-white transition-colors" />
                      <input
                        {...register("password")}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm text-white placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-400 text-xs mt-1 leading-relaxed">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Confirm New Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-white transition-colors" />
                      <input
                        {...register("confirmPassword")}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm text-white placeholder:text-slate-600"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <button
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-md bg-white text-black font-semibold hover:bg-slate-200 transition-colors shadow-sm text-sm disabled:opacity-50 mt-2"
                  >
                    {isSubmitting ? "Updating..." : "Reset Password"}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-4"
              >
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-white tracking-tight">Success!</h2>
                  <p className="text-sm text-slate-400">
                    Your password has been successfully reset. redirecting you to the sign in page...
                  </p>
                </div>

                <Link
                  href="/login"
                  className="block w-full py-3 rounded-md bg-white text-black font-semibold hover:bg-slate-200 transition-colors text-sm shadow-xl"
                >
                  Sign In Now
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
