import { prisma } from "../prisma";
import {
  IOrgMembershipRepository,
  OrgMembershipCreateData,
} from "../interfaces/repositories";
import { IOrgMembership } from "../interfaces/domain";

export class OrgMembershipRepository implements IOrgMembershipRepository {
  async create(data: OrgMembershipCreateData): Promise<IOrgMembership> {
    const member = await prisma.orgMembership.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        role: data.role || "member",
      },
      include: { user: true, organization: true },
    });
    return this.toDomain(member);
  }

  async findByUser(userId: string): Promise<IOrgMembership[]> {
    const members = await prisma.orgMembership.findMany({
      where: { userId },
      include: { user: true, organization: true },
      orderBy: { createdAt: "asc" },
    });
    return members.map(this.toDomain);
  }

  async findByOrganization(organizationId: string): Promise<IOrgMembership[]> {
    const members = await prisma.orgMembership.findMany({
      where: { organizationId },
      include: { user: true, organization: true },
      orderBy: { createdAt: "asc" },
    });
    return members.map(this.toDomain);
  }

  async isOfficer(userId: string, organizationId: string): Promise<boolean> {
    const m = await prisma.orgMembership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      select: { role: true },
    });
    return m ? m.role === "owner" || m.role === "officer" : false;
  }

  async delete(id: string): Promise<void> {
    await prisma.orgMembership.delete({ where: { id } });
  }

  private toDomain = (m: any): IOrgMembership => ({
    id: m.id,
    userId: m.userId,
    organizationId: m.organizationId,
    role: m.role,
    createdAt: m.createdAt,
    user: m.user || undefined,
    organization: m.organization || undefined,
  });
}
