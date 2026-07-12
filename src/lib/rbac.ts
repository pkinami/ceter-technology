import { redirect } from "next/navigation";
import { cache } from "react";
import type { PermissionAction, PermissionModule, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type PermissionCode = `${Lowercase<PermissionModule>}.${Lowercase<PermissionAction>}`;

export const permissionCatalog: Array<{
  module: PermissionModule;
  action: PermissionAction;
  description: string;
}> = [
  { module: "PRODUCTS", action: "VIEW", description: "View all products" },
  { module: "PRODUCTS", action: "CREATE", description: "Create products" },
  { module: "PRODUCTS", action: "EDIT", description: "Edit product details, pricing, inventory, categories, and media" },
  { module: "PRODUCTS", action: "DELETE", description: "Delete products" },
  { module: "PRODUCTS", action: "BULK", description: "Run bulk product updates and deletions" },
  { module: "ORDERS", action: "VIEW", description: "View all orders" },
  { module: "ORDERS", action: "EDIT", description: "Edit order details and internal notes" },
  { module: "ORDERS", action: "CANCEL", description: "Cancel orders" },
  { module: "ORDERS", action: "UPDATE_STATUS", description: "Update order and delivery status" },
  { module: "CUSTOMERS", action: "VIEW", description: "View customer information" },
  { module: "CUSTOMERS", action: "EDIT", description: "Edit customer information" },
  { module: "REPORTS", action: "VIEW", description: "View sales, payment, and business reports" },
  { module: "REPORTS", action: "EXPORT", description: "Export reports" },
  { module: "SETTINGS", action: "MANAGE", description: "Manage system settings" },
  { module: "USERS", action: "VIEW", description: "View admin users" },
  { module: "USERS", action: "CREATE", description: "Create local user records" },
  { module: "USERS", action: "EDIT", description: "Edit users and role assignments" },
  { module: "ROLES", action: "VIEW", description: "View roles" },
  { module: "ROLES", action: "CREATE", description: "Create custom roles" },
  { module: "ROLES", action: "EDIT", description: "Edit roles" },
  { module: "ROLES", action: "DELETE", description: "Delete custom roles" },
  { module: "PERMISSIONS", action: "VIEW", description: "View permission matrix" },
  { module: "PERMISSIONS", action: "MANAGE", description: "Assign and remove permissions" },
  { module: "CATEGORIES", action: "MANAGE", description: "Manage product categories" },
  { module: "MEDIA", action: "MANAGE", description: "Manage product images and media" },
  { module: "MARKETING", action: "MANAGE", description: "Manage campaigns, promotions, banners, and SEO content" },
];

const roleCatalog = [
  {
    name: "Super Admin",
    slug: "super-admin",
    description: "Full system access, users, permissions, settings, and all modules.",
    permissions: permissionCatalog.map((item) => codeFor(item.module, item.action)),
  },
  {
    name: "Product Manager",
    slug: "product-manager",
    description: "Products, categories, images, pricing, and inventory.",
    permissions: [
      "products.view",
      "products.create",
      "products.edit",
      "products.delete",
      "products.bulk",
      "categories.manage",
      "media.manage",
    ],
  },
  {
    name: "Order Manager",
    slug: "order-manager",
    description: "Customer orders, delivery status, and order issues.",
    permissions: ["orders.view", "orders.edit", "orders.cancel", "orders.update_status", "customers.view"],
  },
  {
    name: "Accountant",
    slug: "accountant",
    description: "Sales, payments, invoices, and financial reports without product edits.",
    permissions: ["reports.view", "reports.export", "orders.view"],
  },
  {
    name: "Marketing Manager",
    slug: "marketing-manager",
    description: "Campaigns, promotions, banners, and SEO content.",
    permissions: ["marketing.manage", "products.view", "reports.view"],
  },
  {
    name: "Customer Support",
    slug: "customer-support",
    description: "Customer and order visibility with support notes only.",
    permissions: ["customers.view", "orders.view", "orders.edit"],
  },
];

function codeFor(module: PermissionModule, action: PermissionAction): PermissionCode {
  return `${module.toLowerCase()}.${action.toLowerCase()}` as PermissionCode;
}

export function permissionCode(module: PermissionModule, action: PermissionAction) {
  return codeFor(module, action);
}

export const ensureDefaultRbac = cache(async () => {
  for (const permission of permissionCatalog) {
    await prisma.permission.upsert({
      where: { module_action: { module: permission.module, action: permission.action } },
      update: {
        code: codeFor(permission.module, permission.action),
        description: permission.description,
      },
      create: {
        code: codeFor(permission.module, permission.action),
        module: permission.module,
        action: permission.action,
        description: permission.description,
      },
    });
  }

  for (const role of roleCatalog) {
    const savedRole = await prisma.userRole.upsert({
      where: { slug: role.slug },
      update: {
        name: role.name,
        description: role.description,
        isSystem: true,
      },
      create: {
        name: role.name,
        slug: role.slug,
        description: role.description,
        isSystem: true,
      },
    });

    const permissions = await prisma.permission.findMany({
      where: { code: { in: role.permissions } },
      select: { id: true },
    });

    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: savedRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: savedRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const superAdminRole = await prisma.userRole.findUnique({ where: { slug: "super-admin" } });
  if (superAdminRole) {
    const legacyAdmins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    for (const admin of legacyAdmins) {
      await prisma.userRoleAssignment.upsert({
        where: {
          userId_roleId: {
            userId: admin.id,
            roleId: superAdminRole.id,
          },
        },
        update: {},
        create: {
          userId: admin.id,
          roleId: superAdminRole.id,
        },
      });
    }
  }
});

export const getCurrentUserWithAccess = cache(async () => {
  await ensureDefaultRbac();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const assignments = await prisma.userRoleAssignment.findMany({
    where: { userId: user.id },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissionSet = new Set<string>();
  const roles = assignments.map((assignment) => {
    for (const rolePermission of assignment.role.permissions) {
      permissionSet.add(rolePermission.permission.code);
    }

    return assignment.role;
  });

  return {
    ...user,
    roles,
    permissions: permissionSet,
  };
});

export async function requirePermission(module: PermissionModule, action: PermissionAction) {
  const user = await getCurrentUserWithAccess();

  if (!user) {
    redirect("/admin/login");
  }

  if (!user.permissions.has(codeFor(module, action))) {
    redirect("/admin/login?error=not-authorized");
  }

  return user;
}

export async function requireAnyPermission(...permissions: Array<[PermissionModule, PermissionAction]>) {
  const user = await getCurrentUserWithAccess();

  if (!user) {
    redirect("/admin/login");
  }

  if (!permissions.some(([module, action]) => user.permissions.has(codeFor(module, action)))) {
    redirect("/admin/login?error=not-authorized");
  }

  return user;
}

export async function logAudit(input: {
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  field?: string;
  previousValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? "System",
      action: input.action,
      module: input.module,
      entityType: input.entityType,
      entityId: input.entityId,
      field: input.field,
      previousValue: input.previousValue,
      newValue: input.newValue,
      metadata: input.metadata,
    },
  });
}
