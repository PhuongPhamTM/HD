/** Admins manage users and can replace or reset the whole Sheet; editors work on content. */
export const USER_ROLES = ["admin", "editor"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const isUserRole = (value: unknown): value is UserRole =>
  USER_ROLES.includes(value as UserRole);
