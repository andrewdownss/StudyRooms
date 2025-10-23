/**
 * Zod Validation Schemas
 *
 * Type-safe input validation for all API endpoints.
 * Zod provides both runtime validation and TypeScript type inference.
 */

import { z } from "zod";

// ============================================================================
// BOOKING SCHEMAS
// ============================================================================

export const BookingCreateSchema = z.object({
  category: z.enum(["small", "large"], {
    errorMap: () => ({ message: 'Category must be either "small" or "large"' }),
  }),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  duration: z
    .number()
    .min(30, "Minimum booking duration is 30 minutes")
    .max(120, "Maximum booking duration is 120 minutes")
    .refine(
      (val: number) => val % 30 === 0,
      "Duration must be in 30-minute increments"
    ),
  organizationId: z.string().cuid().optional(),
});

export const BookingUpdateSchema = z.object({
  status: z.enum(
    ["pending", "confirmed", "cancelled", "completed", "rejected"],
    {
      errorMap: () => ({ message: "Invalid booking status" }),
    }
  ),
});

export const BookingQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(["confirmed", "cancelled", "completed"]).optional(),
  upcoming: z.enum(["true", "false"]).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

// ============================================================================
// ROOM SCHEMAS
// ============================================================================

export const RoomCreateSchema = z.object({
  name: z.string().min(1, "Room name is required").max(100),
  category: z.enum(["small", "large"]),
  capacity: z.number().min(1).max(50),
  description: z.string().max(500).optional(),
});

export const RoomUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.enum(["small", "large"]).optional(),
  capacity: z.number().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
});

export const RoomQuerySchema = z.object({
  category: z.enum(["small", "large"]).optional(),
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const UserRoleSchema = z.enum(["user", "admin", "organization"]);

export const UserUpdateSchema = z.object({
  role: UserRoleSchema.optional(),
});

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

/**
 * Sign-In Validation Schema
 * Simple validation for email/password login
 */
export const CredentialsSignInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .endsWith("@g.cofc.edu", "Must be a @g.cofc.edu email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Sign-Up Validation Schema
 * Validates new user registration with password confirmation
 */
export const CredentialsSignUpSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address")
      .endsWith("@g.cofc.edu", "Must be a @g.cofc.edu email address"),
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Export inferred types for TypeScript
export type BookingCreateInput = z.infer<typeof BookingCreateSchema>;
export type BookingUpdateInput = z.infer<typeof BookingUpdateSchema>;
export type BookingQueryInput = z.infer<typeof BookingQuerySchema>;
export type RoomCreateInput = z.infer<typeof RoomCreateSchema>;
export type RoomUpdateInput = z.infer<typeof RoomUpdateSchema>;
export type RoomQueryInput = z.infer<typeof RoomQuerySchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type CredentialsSignIn = z.infer<typeof CredentialsSignInSchema>;
export type CredentialsSignUp = z.infer<typeof CredentialsSignUpSchema>;
