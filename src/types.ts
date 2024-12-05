// src/types.ts

/**
 * Branded types for better type safety with IDs
 */
export type CourseId = number & { readonly brand: unique symbol };
export type AssignmentId = number & { readonly brand: unique symbol };
export type UserId = number & { readonly brand: unique symbol };
export type EnrollmentId = number & { readonly brand: unique symbol };

/**
 * Error types
 */
export class CanvasAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'CanvasAPIError';
  }
}

export class CanvasValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CanvasValidationError';
  }
}

/**
 * API Response types
 */
export interface PaginatedResponse<T> {
  readonly data: ReadonlyArray<T>;
  readonly hasMore: boolean;
  readonly nextPage?: string;
}

export interface CanvasUser {
  readonly id: UserId;
  readonly name: string;
  readonly sortable_name: string;
  readonly short_name: string;
  readonly sis_user_id: string | null;
  readonly email: string;
  readonly avatar_url: string;
}

export interface CanvasCourse {
  readonly id: CourseId;
  readonly name: string;
  readonly course_code: string;
  readonly workflow_state: CanvasCourseState;
  readonly account_id: number;
  readonly start_at: string | null;
  readonly end_at: string | null;
  readonly enrollments?: ReadonlyArray<CanvasEnrollment>;
  readonly total_students?: number;
}

export type CanvasCourseState = 
  | 'unpublished'
  | 'available'
  | 'completed'
  | 'deleted';

export interface CanvasAssignment {
  readonly id: AssignmentId;
  readonly course_id: CourseId;
  readonly name: string;
  readonly description: string;
  readonly due_at: string | null;
  readonly points_possible: number;
  readonly position: number;
  readonly submission_types: ReadonlyArray<CanvasSubmissionType>;
}

export type CanvasSubmissionType =
  | 'none'
  | 'online_text_entry'
  | 'online_url'
  | 'online_upload'
  | 'media_recording'
  | 'student_annotation';

export interface CanvasSubmission {
  readonly id: number;
  readonly assignment_id: AssignmentId;
  readonly user_id: UserId;
  readonly submitted_at: string | null;
  readonly score: number | null;
  readonly grade: string | null;
  readonly attempt: number;
  readonly workflow_state: CanvasSubmissionState;
}

export type CanvasSubmissionState =
  | 'submitted'
  | 'unsubmitted'
  | 'graded'
  | 'pending_review';

export interface CanvasEnrollment {
  readonly id: EnrollmentId;
  readonly user_id: UserId;
  readonly course_id: CourseId;
  readonly type: CanvasEnrollmentType;
  readonly role: string;
  readonly enrollment_state: CanvasEnrollmentState;
  readonly grades?: CanvasGrades;
}

export type CanvasEnrollmentType =
  | 'StudentEnrollment'
  | 'TeacherEnrollment'
  | 'TaEnrollment'
  | 'DesignerEnrollment'
  | 'ObserverEnrollment';

export type CanvasEnrollmentState =
  | 'active'
  | 'invited'
  | 'inactive'
  | 'completed'
  | 'rejected';

export interface CanvasGrades {
  readonly current_score: number | null;
  readonly final_score: number | null;
  readonly current_grade: string | null;
  readonly final_grade: string | null;
}

/**
 * Tool input types with strict validation
 */
export interface CreateCourseArgs {
  name: string;
  course_code?: string;
  start_at?: string;
  end_at?: string;
  license?: string;
  is_public?: boolean;
}

export interface UpdateCourseArgs {
  course_id: number;
  name?: string;
  course_code?: string;
  start_at?: string;
  end_at?: string;
  license?: string;
  is_public?: boolean;
}

export interface CreateAssignmentArgs {
  course_id: number;
  name: string;
  description?: string;
  due_at?: string;
  points_possible?: number;
  submission_types?: string[];
  allowed_extensions?: string[];
}

export interface UpdateAssignmentArgs {
  course_id: number;
  assignment_id: number;
  name?: string;
  description?: string;
  due_at?: string;
  points_possible?: number;
}

export interface SubmitGradeArgs {
  course_id: number;
  assignment_id: number;
  user_id: number;
  grade: number | string;
  comment?: string;
}

export interface EnrollUserArgs {
  course_id: number;
  user_id: number;
  role?: string;
  enrollment_state?: string;
}

/**
 * Configuration types
 */
export interface CanvasClientConfig {
  readonly token: string;
  readonly domain: string;
  readonly timeout?: number;
  readonly retryAttempts?: number;
  readonly rateLimitPerSecond?: number;
}

/**
 * Validation utilities
 */
export function isValidId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

export function validateCourseId(id: number): CourseId {
  if (!isValidId(id)) {
    throw new CanvasValidationError(`Invalid course ID: ${id}`);
  }
  return id as CourseId;
}

export function validateAssignmentId(id: number): AssignmentId {
  if (!isValidId(id)) {
    throw new CanvasValidationError(`Invalid assignment ID: ${id}`);
  }
  return id as AssignmentId;
}

export function validateUserId(id: number): UserId {
  if (!isValidId(id)) {
    throw new CanvasValidationError(`Invalid user ID: ${id}`);
  }
  return id as UserId;
}

export function validateEnrollmentId(id: number): EnrollmentId {
  if (!isValidId(id)) {
    throw new CanvasValidationError(`Invalid enrollment ID: ${id}`);
  }
  return id as EnrollmentId;
}
