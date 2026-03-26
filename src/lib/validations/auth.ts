import { z } from "zod";

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Please provide a valid email address").toLowerCase(),
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(USERNAME_PATTERN, "Only letters, numbers, and underscores allowed"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(PASSWORD_PATTERN, "Must contain uppercase, lowercase, and a number"),
});

export const joinWorkspaceSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
  role: z.string().min(1, "Please select a role"),
});

export const registerOrgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters").max(100),
  email: z.string().email("Please provide a valid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(PASSWORD_PATTERN, "Must contain uppercase, lowercase, and a number"),
  category: z.string().min(2, "Category is required").max(100),
  roles: z.array(z.string().min(1).max(50)),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address").toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(PASSWORD_PATTERN, "Must contain uppercase, lowercase, and a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type JoinWorkspaceFormValues = z.infer<typeof joinWorkspaceSchema>;
export type RegisterOrgFormValues = z.infer<typeof registerOrgSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;