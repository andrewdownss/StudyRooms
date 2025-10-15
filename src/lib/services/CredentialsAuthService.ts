/**
 * Credentials Authentication Service
 * 
 * Demonstrates Object-Oriented Design Principles:
 * 1. ENCAPSULATION - Private methods hide implementation details (password hashing, validation)
 * 2. ABSTRACTION - Interface defines contract, hiding complexity from consumers
 * 3. SINGLE RESPONSIBILITY - Each method has one clear purpose
 * 4. DEPENDENCY INVERSION - Depends on IUserRepository interface, not concrete implementation
 */

import { IUserRepository } from '../interfaces/repositories';
import { UserEntity } from '../domain/User';
import { ValidationError, UnauthorizedError } from '../errors';
import bcrypt from 'bcryptjs';

/**
 * ABSTRACTION: Interface defines what the service can do without exposing how
 */
export interface ICredentialsAuthService {
  validateCredentials(email: string, password: string): Promise<UserEntity>;
  registerUser(email: string, password: string, name: string): Promise<UserEntity>;
  canUserRegister(email: string): Promise<boolean>;
}

/**
 * PASSWORD REQUIREMENTS - Centralized configuration for easy modification
 * This demonstrates the DRY principle and makes requirements easy to change
 */
const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  // Future: Add more requirements here
  // REQUIRE_UPPERCASE: true,
  // REQUIRE_NUMBER: true,
  // REQUIRE_SPECIAL_CHAR: true,
};

/**
 * CONCRETE IMPLEMENTATION: CredentialsAuthService
 * 
 * This class demonstrates:
 * - ENCAPSULATION: Private helper methods hide complexity
 * - DEPENDENCY INJECTION: UserRepository injected via constructor
 * - SINGLE RESPONSIBILITY: Only handles credential-based authentication
 */
export class CredentialsAuthService implements ICredentialsAuthService {
  // DEPENDENCY INJECTION: Repository injected, enabling testability and flexibility
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Validates user credentials for sign-in
   * 
   * SINGLE RESPONSIBILITY: Only validates login credentials
   * 
   * @throws {UnauthorizedError} if credentials are invalid
   * @returns Promise<UserEntity> authenticated user
   */
  async validateCredentials(email: string, password: string): Promise<UserEntity> {
    // Step 1: Email domain validation (College of Charleston only)
    this.validateEmailDomain(email);

    // Step 2: Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Generic error message for security (don't reveal if email exists)
      throw new UnauthorizedError('Invalid email or password');
    }

    // Step 3: Check if user has a password (not Google-only account)
    if (!user.password) {
      throw new UnauthorizedError('This account uses Google sign-in. Please use "Continue with Google".');
    }

    // Step 4: Verify password using bcrypt
    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Step 5: Return authenticated user (wrapped in domain model)
    return new UserEntity(user);
  }

  /**
   * Registers a new user with email/password
   * 
   * SINGLE RESPONSIBILITY: Only handles user registration
   * 
   * @throws {ValidationError} if input is invalid or email already exists
   * @returns Promise<UserEntity> newly created user
   */
  async registerUser(email: string, password: string, name: string): Promise<UserEntity> {
    // Step 1: Validate email domain
    this.validateEmailDomain(email);

    // Step 2: Validate password requirements
    this.validatePassword(password);

    // Step 3: Check if email is already registered
    const canRegister = await this.canUserRegister(email);
    if (!canRegister) {
      throw new ValidationError('Email already registered', 'email');
    }

    // Step 4: Hash password securely
    const hashedPassword = await this.hashPassword(password);

    // Step 5: Determine user role (admin if in ADMIN_EMAILS env var)
    const role = this.isAdminEmail(email) ? 'admin' : 'user';

    // Step 6: Create user in database
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      role,
      authProvider: 'credentials',
    });

    // Step 7: Return newly created user (wrapped in domain model)
    return new UserEntity(user);
  }

  /**
   * Checks if an email can be used for registration
   * 
   * @returns Promise<boolean> true if email is available
   */
  async canUserRegister(email: string): Promise<boolean> {
    const existing = await this.userRepository.findByEmail(email);
    return !existing;
  }

  // ==================== PRIVATE HELPER METHODS ====================
  // ENCAPSULATION: These methods hide implementation details from consumers
  // ================================================================

  /**
   * ENCAPSULATION: Private method - hides email validation logic
   * Validates that email ends with @g.cofc.edu
   * 
   * @throws {ValidationError} if email domain is invalid
   */
  private validateEmailDomain(email: string): void {
    if (!email.endsWith('@g.cofc.edu')) {
      throw new ValidationError(
        'Only @g.cofc.edu email addresses are allowed',
        'email'
      );
    }
  }

  /**
   * ENCAPSULATION: Private method - hides password validation rules
   * Validates password meets minimum requirements
   * 
   * @throws {ValidationError} if password doesn't meet requirements
   */
  private validatePassword(password: string): void {
    if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
      throw new ValidationError(
        `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`,
        'password'
      );
    }
    
    // Future: Add more validation rules here
    // Example:
    // if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    //   throw new ValidationError('Password must contain an uppercase letter', 'password');
    // }
  }

  /**
   * ENCAPSULATION: Private method - hides password hashing implementation
   * Uses bcrypt for secure password hashing
   * 
   * SECURITY: Uses industry-standard bcrypt with salt rounds
   */
  private async hashPassword(password: string): Promise<string> {
    const SALT_ROUNDS = 10; // Industry standard for bcrypt
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * ENCAPSULATION: Private method - hides password verification logic
   * Compares plain text password with hashed password
   * 
   * SECURITY: Uses bcrypt's timing-safe comparison
   */
  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * ENCAPSULATION: Private method - determines if email should have admin role
   * Checks against ADMIN_EMAILS environment variable
   */
  private isAdminEmail(email: string): boolean {
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    
    return adminEmails.includes(email.toLowerCase());
  }
}

