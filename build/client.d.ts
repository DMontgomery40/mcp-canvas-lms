import { CanvasCourse, CanvasAssignment, CanvasSubmission, CanvasUser, CanvasEnrollment, CreateCourseArgs, UpdateCourseArgs, CreateAssignmentArgs, UpdateAssignmentArgs, SubmitGradeArgs, EnrollUserArgs, CanvasDiscussionTopic, CanvasModule, CanvasModuleItem, CanvasQuiz, CanvasAnnouncement, CanvasUserProfile, CanvasScope, CanvasAssignmentSubmission } from './types.js';
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
    getSubmission(courseId: number, assignmentId: number, userId: number): Promise<CanvasSubmission>;
    submitGrade(args: SubmitGradeArgs): Promise<CanvasSubmission>;
    listUsers(courseId: number): Promise<CanvasUser[]>;
    getEnrollments(courseId: number): Promise<CanvasEnrollment[]>;
    enrollUser(args: EnrollUserArgs): Promise<CanvasEnrollment>;
    unenrollUser(courseId: number, enrollmentId: number): Promise<void>;
    getCourseGrades(courseId: number): Promise<CanvasEnrollment[]>;
    getUserProfile(): Promise<CanvasUserProfile>;
    listStudentCourses(): Promise<CanvasCourse[]>;
    listModules(courseId: number): Promise<CanvasModule[]>;
    getModule(courseId: number, moduleId: number): Promise<CanvasModule>;
    listModuleItems(courseId: number, moduleId: number): Promise<CanvasModuleItem[]>;
    getModuleItem(courseId: number, moduleId: number, itemId: number): Promise<CanvasModuleItem>;
    listDiscussionTopics(courseId: number): Promise<CanvasDiscussionTopic[]>;
    getDiscussionTopic(courseId: number, topicId: number): Promise<CanvasDiscussionTopic>;
    listAnnouncements(courseId: string): Promise<CanvasAnnouncement[]>;
    listQuizzes(courseId: string): Promise<CanvasQuiz[]>;
    getQuiz(courseId: string, quizId: number): Promise<CanvasQuiz>;
    createQuiz(courseId: number, quizData: Partial<CanvasQuiz>): Promise<CanvasQuiz>;
    updateQuiz(courseId: number, quizId: number, quizData: Partial<CanvasQuiz>): Promise<CanvasQuiz>;
    deleteQuiz(courseId: number, quizId: number): Promise<void>;
    listFiles(courseId: number): Promise<any[]>;
    getFile(fileId: number): Promise<any>;
    /**
     * List scopes for a given account.
     * This endpoint is BETA and may change.
     *
     * GET /api/v1/accounts/:account_id/scopes
     * Optional parameter: group_by (e.g., 'resource_name')
     */
    listTokenScopes(accountId: number, groupBy?: string): Promise<CanvasScope[]>;
    submitAssignment(args: {
        course_id: string;
        assignment_id: number;
        user_id: number;
        submission_type: string;
        body?: string;
    }): Promise<CanvasAssignmentSubmission>;
}
