/**
 * Authentication Middleware
 * 
 * Utilities for extracting and validating authenticated users in API routes.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth';
import { prisma } from '../../prisma';
import { UnauthorizedError, NotFoundError } from '../../errors';

/**
 * Get the current authenticated user's ID
 * 
 * @throws {UnauthorizedError} if user is not authenticated
 * @throws {NotFoundError} if user is not found in database (fallback only)
 */
export async function getCurrentUserId(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new UnauthorizedError('Authentication required');
  }

  // Try to get from session first (new way - fast!)
  if (session.user.id) {
    return session.user.id;
  }

  // Fallback for existing sessions that don't have userId in token yet
  // This will only happen for users who were logged in before this change
  // They'll get the userId added to their token on next login
  console.warn('DEPRECATED: Fetching user ID from database. User should re-login to improve performance.');
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user.id;
}

/**
 * Get the current authenticated user's full details
 * 
 * @throws {UnauthorizedError} if user is not authenticated
 * @throws {NotFoundError} if user is not found in database
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new UnauthorizedError('Authentication required');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

/**
 * Check if current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return !!session?.user?.email;
}

