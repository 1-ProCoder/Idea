/**
 * Shared types and constants used by both @flowfix/web and @flowfix/api.
 *
 * These mirror the Prisma `enum` definitions in `apps/api/prisma/schema.prisma`
 * so both ends of the wire agree on the allowed values without each having
 * to import from `@prisma/client`.
 */

export type JobStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type JobPriority = 'NORMAL' | 'URGENT' | 'EMERGENCY';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type WorkerRole = 'OWNER' | 'ADMIN' | 'DISPATCHER' | 'TECHNICIAN';

export type MembershipRole = 'OWNER' | 'ADMIN' | 'DISPATCHER' | 'TECHNICIAN';

export const JOB_STATUSES: readonly JobStatus[] = [
  'PENDING',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

export const JOB_PRIORITIES: readonly JobPriority[] = [
  'NORMAL',
  'URGENT',
  'EMERGENCY',
] as const;

export const EMERGENCY_PRIORITIES: readonly JobPriority[] = ['EMERGENCY'] as const;

/** Human-readable label for a job status. Used in the UI. */
export function jobStatusLabel(status: JobStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'SCHEDULED':
      return 'Scheduled';
    case 'IN_PROGRESS':
      return 'In progress';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
  }
}
