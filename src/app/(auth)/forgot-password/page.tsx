"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordFormValues } from "@/lib/validations/auth";
import { api } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setError(null);
      await api.post("/auth/forgot-password", data);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative text-white font-sans overflow-hidden bg-black">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[120px] pointer-events-none"></div>
      
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
                  <h1 className="text-2xl font-semibold tracking-tight text-white">
                    Forgot Password
                  </h1>
                  <p className="text-sm text-slate-400">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        {...register("email")}
                        type="email"
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm text-white placeholder:text-slate-600"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <button
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-md bg-white text-black font-semibold hover:bg-slate-200 transition-colors shadow-sm text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? "Sending Link..." : "Send Reset Link"}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
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
                  <h2 className="text-2xl font-semibold text-white">Check your email</h2>
                  <p className="text-sm text-slate-400">
                    If an account exists, you'll receive an email shortly. Please check your inbox and spam folder.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="block w-full py-3 rounded-md bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors text-sm"
                >
                  Return to Sign In
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer text */}
      <p className="mt-8 text-center text-sm text-slate-500 max-w-sm relative z-10">
        Need help? <Link href="#" className="underline underline-offset-4 hover:text-white transition-colors">Contact Support</Link>
      </p>
    </div>
  );
}
