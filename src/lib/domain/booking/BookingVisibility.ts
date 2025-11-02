/**
 * Booking Visibility Value Object
 * 
 * Encapsulates booking visibility rules and behavior
 * 
 * OOP Principles:
 * - Value Object: Immutable, equality by value
 * - Factory Methods: Static constructors for different visibility types
 * - Encapsulation: Visibility logic hidden inside
 */

export enum VisibilityLevel {
  PRIVATE = 'private',      // Only creator sees
  PUBLIC = 'public',        // Anyone can see and join
  ORGANIZATION = 'org'      // Only org members see
}

export class BookingVisibility {
  private constructor(
    private readonly level: VisibilityLevel,
    private readonly maxParticipants: number,
    private readonly allowedOrganizations: Set<string>
  ) {}

  /**
   * Factory: Create private booking (default)
   */
  static createPrivate(): BookingVisibility {
    return new BookingVisibility(
      VisibilityLevel.PRIVATE,
      1,
      new Set()
    );
  }

  /**
   * Factory: Create public booking
   */
  static createPublic(maxParticipants: number = 10): BookingVisibility {
    if (maxParticipants < 1) {
      throw new Error('Max participants must be at least 1');
    }
    
    return new BookingVisibility(
      VisibilityLevel.PUBLIC,
      maxParticipants,
      new Set()
    );
  }

  /**
   * Factory: Create organization-only booking
   */
  static createOrganization(
    orgId: string,
    maxParticipants: number = 10
  ): BookingVisibility {
    if (!orgId) {
      throw new Error('Organization ID required');
    }
    
    return new BookingVisibility(
      VisibilityLevel.ORGANIZATION,
      maxParticipants,
      new Set([orgId])
    );
  }

  /**
   * Reconstruct from database values
   */
  static fromDatabase(
    level: string,
    maxParticipants: number,
    orgId?: string
  ): BookingVisibility {
    const visibilityLevel = level as VisibilityLevel;
    const orgs = orgId ? new Set([orgId]) : new Set<string>();
    
    return new BookingVisibility(
      visibilityLevel,
      maxParticipants,
      orgs
    );
  }

  /**
   * Check if booking is public
   */
  isPublic(): boolean {
    return this.level === VisibilityLevel.PUBLIC;
  }

  /**
   * Check if booking is private
   */
  isPrivate(): boolean {
    return this.level === VisibilityLevel.PRIVATE;
  }

  /**
   * Check if booking is organization-only
   */
  isOrganization(): boolean {
    return this.level === VisibilityLevel.ORGANIZATION;
  }

  /**
   * Check if user can view this booking
   */
  canUserView(userId: string, creatorId: string, userOrgIds: string[]): boolean {
    // Creator can always view
    if (userId === creatorId) {
      return true;
    }

    // Public bookings visible to all
    if (this.isPublic()) {
      return true;
    }

    // Organization bookings visible to members
    if (this.isOrganization()) {
      return userOrgIds.some(id => this.allowedOrganizations.has(id));
    }

    // Private bookings only visible to creator
    return false;
  }

  /**
   * Get display color for UI
   */
  getColorCode(): 'red' | 'blue' | 'gray' {
    switch (this.level) {
      case VisibilityLevel.PRIVATE:
        return 'red';
      case VisibilityLevel.PUBLIC:
        return 'blue';
      case VisibilityLevel.ORGANIZATION:
        return 'gray';
    }
  }

  /**
   * Get visibility level
   */
  getLevel(): VisibilityLevel {
    return this.level;
  }

  /**
   * Get max participants
   */
  getMaxParticipants(): number {
    return this.maxParticipants;
  }

  /**
   * Get database representation
   */
  toDatabase(): { level: string; maxParticipants: number } {
    return {
      level: this.level,
      maxParticipants: this.maxParticipants
    };
  }
}

