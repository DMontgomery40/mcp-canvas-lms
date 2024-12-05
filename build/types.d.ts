/**
 * Branded types for better type safety with IDs
 */
export type CourseId = number & {
    readonly brand: unique symbol;
};
export type AssignmentId = number & {
    readonly brand: unique symbol;
};
export type UserId = number & {
    readonly brand: unique symbol;
};
export type EnrollmentId = number & {
    readonly brand: unique symbol;
};
/**
 * Error types
 */
export declare class CanvasAPIError extends Error {
    readonly statusCode?: number | undefined;
    readonly response?: unknown | undefined;
    constructor(message: string, statusCode?: number | undefined, response?: unknown | undefined);
}
export declare class CanvasValidationError extends Error {
    constructor(message: string);
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
export interface CanvasUserProfile {
    id: number;
    name: string;
    sortable_name: string;
    short_name: string;
    sis_user_id: string | null;
    login_id: string;
    avatar_url: string;
    primary_email: string;
    locale: string;
    bio: string | null;
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
export type CanvasCourseState = 'unpublished' | 'available' | 'completed' | 'deleted';
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
export type CanvasSubmissionType = 'none' | 'online_text_entry' | 'online_url' | 'online_upload' | 'media_recording' | 'student_annotation';
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
export type CanvasSubmissionState = 'submitted' | 'unsubmitted' | 'graded' | 'pending_review';
export interface CanvasEnrollment {
    readonly id: EnrollmentId;
    readonly user_id: UserId;
    readonly course_id: CourseId;
    readonly type: CanvasEnrollmentType;
    readonly role: string;
    readonly enrollment_state: CanvasEnrollmentState;
    readonly grades?: CanvasGrades;
}
export type CanvasEnrollmentType = 'StudentEnrollment' | 'TeacherEnrollment' | 'TaEnrollment' | 'DesignerEnrollment' | 'ObserverEnrollment';
export type CanvasEnrollmentState = 'active' | 'invited' | 'inactive' | 'completed' | 'rejected';
export interface CanvasGrades {
    readonly current_score: number | null;
    readonly final_score: number | null;
    readonly current_grade: string | null;
    readonly final_grade: string | null;
}
export interface CanvasDiscussionTopic {
    id: number;
    title: string;
    message: string;
    html_url: string;
    posted_at: string;
    assignment_id: number | null;
    discussion_type: string;
}
export interface CanvasModule {
    id: number;
    name: string;
    position: number;
    unlock_at: string | null;
    require_sequential_progress: boolean;
    state: string;
}
export interface CanvasModuleItem {
    id: number;
    title: string;
    type: string;
    html_url: string;
    content_id?: number;
}
export interface CanvasQuiz {
    id: number;
    title: string;
    html_url: string;
    quiz_type: string;
    time_limit: number | null;
    published: boolean;
    description: string | null;
    due_at: string | null;
}
export interface CanvasAnnouncement {
    id: number;
    title: string;
    message: string;
    posted_at: string;
    html_url: string;
}
export interface CanvasScope {
    resource: string;
    resource_name: string;
    controller: string;
    action: string;
    verb: string;
    scope: string;
}
export interface CanvasAssignmentSubmission {
    id: number;
    submission_type: string;
    body?: string;
    submitted_at: string | null;
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
