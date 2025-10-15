/**
 * User Repository Implementation
 * 
 * Handles all database operations for users using Prisma.
 * Demonstrates REPOSITORY PATTERN and ABSTRACTION principles.
 */

import { prisma } from '../prisma';
import { IUserRepository, UserCreateData } from '../interfaces/repositories';
import { IUser } from '../interfaces/domain';

export class UserRepository implements IUserRepository {
  /**
   * Create a new user
   * 
   * @param data User creation data
   * @returns Promise<IUser> newly created user
   */
  async create(data: UserCreateData): Promise<IUser> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name || null,
        password: data.password || null,
        role: data.role || 'user',
        authProvider: data.authProvider,
        image: data.image || null,
      },
    });

    return this.toDomain(user);
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<IUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? this.toDomain(user) : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user ? this.toDomain(user) : null;
  }

  /**
   * Find all users
   */
  async findAll(): Promise<IUser[]> {
    const users = await prisma.user.findMany({
      orderBy: {
        email: 'asc',
      },
    });

    return users.map(u => this.toDomain(u));
  }

  /**
   * Update a user
   */
  async update(id: string, data: Partial<IUser>): Promise<IUser> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.image !== undefined && { image: data.image }),
      },
    });

    return this.toDomain(user);
  }

  /**
   * Update user role
   */
  async updateRole(id: string, role: string): Promise<IUser> {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    return this.toDomain(user);
  }

  /**
   * Count all users
   */
  async count(): Promise<number> {
    return prisma.user.count();
  }

  /**
   * Check if user exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Convert Prisma model to domain model
   * ENCAPSULATION: Hides Prisma implementation details from consumers
   */
  private toDomain(prismaUser: any): IUser {
    return {
      id: prismaUser.id,
      name: prismaUser.name,
      email: prismaUser.email,
      emailVerified: prismaUser.emailVerified,
      image: prismaUser.image,
      role: prismaUser.role,
      password: prismaUser.password || null,
      authProvider: prismaUser.authProvider || 'google',
    };
  }
}

