import { CanvasCourse, CanvasAssignment, CanvasSubmission, CanvasUser, CanvasEnrollment, CreateCourseArgs, UpdateCourseArgs, CreateAssignmentArgs, UpdateAssignmentArgs, SubmitGradeArgs, EnrollUserArgs } from './types.js';
export declare class CanvasClient {
    private client;
    private baseURL;
    constructor(token: string, domain: string);
    private getNextPageUrl;
    listCourses(): Promise<CanvasCourse[]>;
    getCourse(courseId: number): Promise<CanvasCourse>;
    createCourse(args: CreateCourseArgs): Promise<CanvasCourse>;
    updateCourse(args: UpdateCourseArgs): Promise<CanvasCourse>;
    deleteCourse(courseId: number): Promise<void>;
    listAssignments(courseId: number): Promise<CanvasAssignment[]>;
    getAssignment(courseId: number, assignmentId: number): Promise<CanvasAssignment>;
    createAssignment(args: CreateAssignmentArgs): Promise<CanvasAssignment>;
    updateAssignment(args: UpdateAssignmentArgs): Promise<CanvasAssignment>;
    deleteAssignment(courseId: number, assignmentId: number): Promise<void>;
    getSubmissions(courseId: number, assignmentId: number): Promise<CanvasSubmission[]>;
    submitGrade(args: SubmitGradeArgs): Promise<CanvasSubmission>;
    listUsers(courseId: number): Promise<CanvasUser[]>;
    getEnrollments(courseId: number): Promise<CanvasEnrollment[]>;
    enrollUser(args: EnrollUserArgs): Promise<CanvasEnrollment>;
    unenrollUser(courseId: number, enrollmentId: number): Promise<void>;
    getCourseGrades(courseId: number): Promise<CanvasEnrollment[]>;
}
