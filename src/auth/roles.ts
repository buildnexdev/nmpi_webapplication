export const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DISTRICT_ADMIN', 'TALUK_ADMIN', 'UNIT_ADMIN'];
export const CONTENT_ROLES = ['SUPER_ADMIN', 'ADMIN'];
export const PORTAL_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

const ALIASES: Record<string, string> = {
  super_admin: 'SUPER_ADMIN',
  'super admin': 'SUPER_ADMIN',
  admin: 'ADMIN',
  district_admin: 'DISTRICT_ADMIN',
  district_coordinator: 'DISTRICT_ADMIN',
  'district coordinator': 'DISTRICT_ADMIN',
  taluk_admin: 'TALUK_ADMIN',
  taluk_coordinator: 'TALUK_ADMIN',
  'taluk coordinator': 'TALUK_ADMIN',
  unit_admin: 'UNIT_ADMIN',
  unit_coordinator: 'UNIT_ADMIN',
  'unit coordinator': 'UNIT_ADMIN',
  volunteer: 'VOLUNTEER',
  member: 'MEMBER',
};

export const DEFAULT_ROLE_PAGES: Record<string, string[]> = {
  SUPER_ADMIN: ['dashboard', 'members', 'applications', 'reports', 'news', 'events', 'leadership', 'pages', 'media', 'roles', 'account'],
  ADMIN: ['dashboard', 'members', 'applications', 'reports', 'news', 'events', 'leadership', 'pages', 'media', 'roles', 'account'],
  DISTRICT_ADMIN: ['dashboard', 'members', 'applications', 'reports', 'account'],
  TALUK_ADMIN: ['dashboard', 'members', 'applications', 'reports', 'account'],
  UNIT_ADMIN: ['dashboard', 'members', 'applications', 'reports', 'account'],
  VOLUNTEER: ['account'],
  MEMBER: ['account'],
};

export function normalizeRoleCode(name: string | null | undefined): string {
  if (!name) return '';
  const key = String(name).trim().toLowerCase().replace(/[\s-]+/g, ' ');
  const underscored = key.replace(/ /g, '_');
  return ALIASES[key] || ALIASES[underscored] || String(name).trim().toUpperCase().replace(/[\s-]+/g, '_');
}

export function normalizeRoleCodes(roles: string[] | null | undefined): string[] {
  return [...new Set((roles || []).map(normalizeRoleCode).filter(Boolean))];
}

export function isStaffRole(roles: string[] | null | undefined): boolean {
  return normalizeRoleCodes(roles).some((r) => STAFF_ROLES.includes(r));
}

export function isContentRole(roles: string[] | null | undefined): boolean {
  return normalizeRoleCodes(roles).some((r) => CONTENT_ROLES.includes(r));
}

export function isPortalAdminRole(roles: string[] | null | undefined): boolean {
  return normalizeRoleCodes(roles).some((r) => PORTAL_ADMIN_ROLES.includes(r));
}

export function pagesForUser(roles: string[] | null | undefined, pages?: string[] | null): string[] {
  if (pages && pages.length > 0) {
    const set = new Set(pages);
    set.add('account');
    const codes = normalizeRoleCodes(roles);
    if (codes.includes('SUPER_ADMIN') || codes.includes('ADMIN')) set.add('roles');
    else set.delete('roles');
    return [...set];
  }
  const set = new Set<string>(['account']);
  for (const code of normalizeRoleCodes(roles)) {
    (DEFAULT_ROLE_PAGES[code] || []).forEach((p) => set.add(p));
  }
  return [...set];
}
