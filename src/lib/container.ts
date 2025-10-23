/**
 * Dependency Injection Container
 *
 * Creates and wires up all services and repositories.
 * This implements the Singleton pattern and provides dependency injection.
 */

import { BookingRepository } from "./repositories/BookingRepository";
import { RoomRepository } from "./repositories/RoomRepository";
import { UserRepository } from "./repositories/UserRepository";
import { AuthorizationService } from "./services/AuthorizationService";
import { BookingService } from "./services/BookingService";
import { RoomService } from "./services/RoomService";
import { UserService } from "./services/UserService";
import { CredentialsAuthService } from "./services/CredentialsAuthService";
import {
  IOrganizationRepository,
  IOrgMembershipRepository,
} from "./interfaces/repositories";
// Placeholder imports for future repository implementations
// import { OrganizationRepository } from './repositories/OrganizationRepository';
// import { OrgMembershipRepository } from './repositories/OrgMembershipRepository';

/**
 * Service Container
 *
 * Lazy-loads and caches service instances using singleton pattern.
 */
class Container {
  private static instance: Container;

  // Repositories
  private _bookingRepository?: BookingRepository;
  private _roomRepository?: RoomRepository;
  private _userRepository?: UserRepository;
  // private _organizationRepository?: OrganizationRepository;
  // private _orgMembershipRepository?: OrgMembershipRepository;

  // Services
  private _authorizationService?: AuthorizationService;
  private _bookingService?: BookingService;
  private _roomService?: RoomService;
  private _userService?: UserService;
  private _credentialsAuthService?: CredentialsAuthService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Reset all services (useful for testing)
   */
  reset(): void {
    this._bookingRepository = undefined;
    this._roomRepository = undefined;
    this._userRepository = undefined;
    // this._organizationRepository = undefined;
    // this._orgMembershipRepository = undefined;
    this._authorizationService = undefined;
    this._bookingService = undefined;
    this._roomService = undefined;
    this._userService = undefined;
    this._credentialsAuthService = undefined;
  }

  // ============================================================================
  // REPOSITORIES
  // ============================================================================

  get bookingRepository(): BookingRepository {
    if (!this._bookingRepository) {
      this._bookingRepository = new BookingRepository();
    }
    return this._bookingRepository;
  }

  get roomRepository(): RoomRepository {
    if (!this._roomRepository) {
      this._roomRepository = new RoomRepository();
    }
    return this._roomRepository;
  }

  get userRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new UserRepository();
    }
    return this._userRepository;
  }

  // get organizationRepository(): OrganizationRepository {
  //   if (!this._organizationRepository) {
  //     this._organizationRepository = new OrganizationRepository();
  //   }
  //   return this._organizationRepository;
  // }

  // get orgMembershipRepository(): OrgMembershipRepository {
  //   if (!this._orgMembershipRepository) {
  //     this._orgMembershipRepository = new OrgMembershipRepository();
  //   }
  //   return this._orgMembershipRepository;
  // }

  // ============================================================================
  // SERVICES
  // ============================================================================

  get authorizationService(): AuthorizationService {
    if (!this._authorizationService) {
      this._authorizationService = new AuthorizationService(
        this.userRepository
      );
    }
    return this._authorizationService;
  }

  get bookingService(): BookingService {
    if (!this._bookingService) {
      this._bookingService = new BookingService(
        this.bookingRepository,
        this.roomRepository,
        this.userRepository,
        this.authorizationService
      );
    }
    return this._bookingService;
  }

  get roomService(): RoomService {
    if (!this._roomService) {
      this._roomService = new RoomService(
        this.roomRepository,
        this.authorizationService
      );
    }
    return this._roomService;
  }

  get userService(): UserService {
    if (!this._userService) {
      this._userService = new UserService(
        this.userRepository,
        this.authorizationService
      );
    }
    return this._userService;
  }

  get credentialsAuthService(): CredentialsAuthService {
    if (!this._credentialsAuthService) {
      this._credentialsAuthService = new CredentialsAuthService(
        this.userRepository
      );
    }
    return this._credentialsAuthService;
  }
}

/**
 * Export singleton instance
 */
export const container = Container.getInstance();
