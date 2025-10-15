/**
 * Sign-Up API Route
 * 
 * Handles new user registration with email/password.
 * Demonstrates proper error handling and validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { CredentialsSignUpSchema } from '@/lib/validation/schemas';
import { ApplicationError } from '@/lib/errors';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input using Zod schema
    const validatedData = CredentialsSignUpSchema.parse(body);
    
    // Register user using CredentialsAuthService
    const user = await container.credentialsAuthService.registerUser(
      validatedData.email,
      validatedData.password,
      validatedData.name
    );
    
    // Return success response (don't expose password)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        {
          error: firstError.message,
          field: firstError.path.join('.'),
        },
        { status: 400 }
      );
    }
    
    // Handle application errors (ValidationError, etc.)
    if (error instanceof ApplicationError) {
      return NextResponse.json(
        {
          error: error.message,
          field: (error as any).field,
        },
        { status: error.statusCode }
      );
    }
    
    // Handle unexpected errors
    console.error('Sign-up error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

