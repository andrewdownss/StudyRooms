/**
 * User Service
 * 
 * Implements user management business logic with authorization.
 */

import { IUserService } from '../interfaces/services';
import { IUserRepository } from '../interfaces/repositories';
import { IAuthorizationService } from '../interfaces/services';
import { IUser, UserRole } from '../interfaces/domain';
import { NotFoundError } from '../errors';

export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private authorizationService: IAuthorizationService
  ) {}

  /**
   * Get a specific user
   */
  async getUser(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<IUser> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(
    userId: string,
    role: UserRole,
    requesterId: string
  ): Promise<IUser> {
    // Check authorization
    await this.authorizationService.enforceUserManagement(requesterId);

    // Check user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Update role
    return this.userRepository.updateRole(userId, role);
  }
}

