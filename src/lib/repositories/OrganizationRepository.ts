import { prisma } from "../prisma";
import {
  IOrganizationRepository,
  OrganizationCreateData,
} from "../interfaces/repositories";
import { IOrganization } from "../interfaces/domain";

export class OrganizationRepository implements IOrganizationRepository {
  async create(data: OrganizationCreateData): Promise<IOrganization> {
    const org = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        status: data.status || "active",
      },
    });
    return this.toDomain(org);
  }

  async findById(id: string): Promise<IOrganization | null> {
    const org = await prisma.organization.findUnique({ where: { id } });
    return org ? this.toDomain(org) : null;
  }

  async findBySlug(slug: string): Promise<IOrganization | null> {
    const org = await prisma.organization.findUnique({ where: { slug } });
    return org ? this.toDomain(org) : null;
  }

  async findAll(): Promise<IOrganization[]> {
    const orgs = await prisma.organization.findMany({
      orderBy: { name: "asc" },
    });
    return orgs.map(this.toDomain);
  }

  async findByUser(userId: string): Promise<IOrganization[]> {
    const memberships = await prisma.orgMembership.findMany({
      where: { userId },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((m) => this.toDomain(m.organization));
  }

  async update(
    id: string,
    data: Partial<IOrganization>
  ): Promise<IOrganization> {
    const org = await prisma.organization.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.status !== undefined && { status: data.status as any }),
      },
    });
    return this.toDomain(org);
  }

  async delete(id: string): Promise<void> {
    await prisma.organization.delete({ where: { id } });
  }

  private toDomain = (org: any): IOrganization => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    status: org.status,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
  });
}
