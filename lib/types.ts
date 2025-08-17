export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ACCOUNT_ADMIN' 
  | 'SUPPORT_ADMIN' 
  | 'AGENT' 
  | 'TOUR_ORGANIZER_ADMIN' 
  | 'VISA_ORGANIZER_ADMIN'
  | 'INSURRANCE_ORGANIZER_ADMIN'
  | 'CAR_ADMIN'
  | 'USER_ADMIN';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string | Date;
  lastLogin?: string | Date;
  token?: string; // Auth token for API requests
}

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// Dashboard group types for navigation
export type DashboardGroup = 'official' | 'b2b' | 'supplier' | 'user';

// Role to group mapping
export const roleToGroup: Record<UserRole, DashboardGroup> = {
  'SUPER_ADMIN': 'official',
  'ACCOUNT_ADMIN': 'official',
  'SUPPORT_ADMIN': 'official',
  'AGENT': 'b2b',
  'TOUR_ORGANIZER_ADMIN': 'supplier',
  'VISA_ORGANIZER_ADMIN': 'supplier',
  'INSURRANCE_ORGANIZER_ADMIN': 'supplier',
  'CAR_ADMIN': 'supplier',
  'USER_ADMIN': 'user'
};

// Role display names
export const roleDisplayNames: Record<UserRole, string> = {
  'SUPER_ADMIN': 'Super Admin',
  'ACCOUNT_ADMIN': 'Account Admin',
  'SUPPORT_ADMIN': 'Support Admin',
  'AGENT': 'Agent',
  'TOUR_ORGANIZER_ADMIN': 'Tour Organizer Admin',
  'VISA_ORGANIZER_ADMIN': 'Visa Organizer Admin',
  'INSURRANCE_ORGANIZER_ADMIN': 'Insurance Organizer Admin',
  'CAR_ADMIN': 'Car Admin',
  'USER_ADMIN': 'User Admin'
};

// Role colors for visual distinction
export const roleColors: Record<UserRole, string> = {
  'SUPER_ADMIN': 'bg-red-600',
  'ACCOUNT_ADMIN': 'bg-blue-600',
  'SUPPORT_ADMIN': 'bg-purple-600',
  'AGENT': 'bg-green-600',
  'TOUR_ORGANIZER_ADMIN': 'bg-amber-600',
  'VISA_ORGANIZER_ADMIN': 'bg-orange-600',
  'INSURRANCE_ORGANIZER_ADMIN': 'bg-cyan-600',
  'CAR_ADMIN': 'bg-rose-600',
  'USER_ADMIN': 'bg-violet-600'
};