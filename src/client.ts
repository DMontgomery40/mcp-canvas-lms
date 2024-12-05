// src/client.ts

import axios, { AxiosInstance } from 'axios';
import { 
  CanvasCourse, 
  CanvasAssignment,
  CanvasSubmission,
  CanvasUser,
  CanvasEnrollment,
  CreateCourseArgs,
  UpdateCourseArgs,
  CreateAssignmentArgs,
  UpdateAssignmentArgs,
  SubmitGradeArgs,
  EnrollUserArgs,
  CanvasAPIError,
  CanvasDiscussionTopic,
  CanvasModule,
  CanvasModuleItem,
  CanvasQuiz,
  CanvasAnnouncement,
  CanvasUserProfile,
  CanvasScope,
  CanvasAssignmentSubmission
} from './types.js';

export class CanvasClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(token: string, domain: string) {
    this.baseURL = `https://${domain}/api/v1`;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for pagination
    this.client.interceptors.response.use(async (response) => {
      const { headers, data } = response;
      const linkHeader = headers.link;

      // If this is a paginated response, fetch all pages
      if (Array.isArray(data) && linkHeader) {
        let allData = [...data];
        let nextUrl = this.getNextPageUrl(linkHeader);

        while (nextUrl) {
          const nextResponse = await this.client.get(nextUrl);
          allData = [...allData, ...nextResponse.data];
          nextUrl = this.getNextPageUrl(nextResponse.headers.link);
        }

        response.data = allData;
      }

      return response;
    });

    // Add error interceptor
    this.client.interceptors.response.use(undefined, (error) => {
      if (error.response) {
        const { status, data } = error.response;
        throw new CanvasAPIError(`Canvas API Error (${status}): ${data.message || JSON.stringify(data)}`, status, data);
      }
      throw error;
    });
  }

  private getNextPageUrl(linkHeader: string): string | null {
    const links = linkHeader.split(',');
    const nextLink = links.find(link => link.includes('rel="next"'));
    if (!nextLink) return null;

    const match = nextLink.match(/<(.+?)>/);
    return match ? match[1] : null;
  }

  // ---------------------
  // COURSES
  // ---------------------
  async listCourses(): Promise<CanvasCourse[]> {
    const response = await this.client.get('/courses', {
      params: {
        include: ['total_students', 'teachers']
      }
    });
    return response.data;
  }

  async getCourse(courseId: number): Promise<CanvasCourse> {
    const response = await this.client.get(`/courses/${courseId}`, {
      params: {
        include: ['total_students', 'teachers']
      }
    });
    return response.data;
  }

  async createCourse(args: CreateCourseArgs): Promise<CanvasCourse> {
    const response = await this.client.post('/courses', {
      course: args
    });
    return response.data;
  }

  async updateCourse(args: UpdateCourseArgs): Promise<CanvasCourse> {
    const { course_id, ...courseData } = args;
    const response = await this.client.put(`/courses/${course_id}`, {
      course: courseData
    });
    return response.data;
  }

  async deleteCourse(courseId: number): Promise<void> {
    await this.client.delete(`/courses/${courseId}`);
  }

  // ---------------------
  // ASSIGNMENTS
  // ---------------------
  async listAssignments(courseId: number): Promise<CanvasAssignment[]> {
    const response = await this.client.get(`/courses/${courseId}/assignments`);
    return response.data;
  }

  async getAssignment(courseId: number, assignmentId: number): Promise<CanvasAssignment> {
    const response = await this.client.get(`/courses/${courseId}/assignments/${assignmentId}`);
    return response.data;
  }

  async createAssignment(args: CreateAssignmentArgs): Promise<CanvasAssignment> {
    const { course_id, ...assignmentData } = args;
    const response = await this.client.post(`/courses/${course_id}/assignments`, {
      assignment: assignmentData
    });
    return response.data;
  }

  async updateAssignment(args: UpdateAssignmentArgs): Promise<CanvasAssignment> {
    const { course_id, assignment_id, ...assignmentData } = args;
    const response = await this.client.put(
      `/courses/${course_id}/assignments/${assignment_id}`,
      { assignment: assignmentData }
    );
    return response.data;
  }

  async deleteAssignment(courseId: number, assignmentId: number): Promise<void> {
    await this.client.delete(`/courses/${courseId}/assignments/${assignmentId}`);
  }

  // ---------------------
  // SUBMISSIONS
  // ---------------------
  async getSubmissions(courseId: number, assignmentId: number): Promise<CanvasSubmission[]> {
    const response = await this.client.get(
      `/courses/${courseId}/assignments/${assignmentId}/submissions`
    );
    return response.data;
  }

  async getSubmission(courseId: number, assignmentId: number, userId: number): Promise<CanvasSubmission> {
    const response = await this.client.get(
      `/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}`
    );
    return response.data;
  }

  async submitGrade(args: SubmitGradeArgs): Promise<CanvasSubmission> {
    const { course_id, assignment_id, user_id, grade, comment } = args;
    const response = await this.client.put(
      `/courses/${course_id}/assignments/${assignment_id}/submissions/${user_id}`, {
      submission: {
        posted_grade: grade,
        comment: { text_comment: comment }
      }
    });
    return response.data;
  }

  // ---------------------
  // USERS AND ENROLLMENTS
  // ---------------------
  async listUsers(courseId: number): Promise<CanvasUser[]> {
    const response = await this.client.get(`/courses/${courseId}/users`, {
      params: {
        include: ['email', 'enrollments']
      }
    });
    return response.data;
  }

  async getEnrollments(courseId: number): Promise<CanvasEnrollment[]> {
    const response = await this.client.get(`/courses/${courseId}/enrollments`);
    return response.data;
  }

  async enrollUser(args: EnrollUserArgs): Promise<CanvasEnrollment> {
    const { course_id, user_id, role = 'StudentEnrollment', enrollment_state = 'active' } = args;
    const response = await this.client.post(`/courses/${course_id}/enrollments`, {
      enrollment: {
        user_id,
        type: role,
        enrollment_state
      }
    });
    return response.data;
  }

  async unenrollUser(courseId: number, enrollmentId: number): Promise<void> {
    await this.client.delete(`/courses/${courseId}/enrollments/${enrollmentId}`);
  }

  // ---------------------
  // GRADES
  // ---------------------
  async getCourseGrades(courseId: number): Promise<CanvasEnrollment[]> {
    const response = await this.client.get(`/courses/${courseId}/enrollments`, {
      params: {
        include: ['grades']
      }
    });
    return response.data;
  }

  // ---------------------
  // USER PROFILE (STUDENT ACCESSIBLE ENDPOINT)
  // ---------------------
  async getUserProfile(): Promise<CanvasUserProfile> {
    // Fetch the profile of the currently authenticated user
    const response = await this.client.get('/users/self/profile');
    return response.data;
  }

  // ---------------------
  // STUDENT COURSES
  // ---------------------
  async listStudentCourses(): Promise<CanvasCourse[]> {
    // Returns courses visible to the current user (student)
    const response = await this.client.get('/courses', {
      params: {
        include: ['enrollments', 'total_students']
      }
    });
    return response.data;
  }

  // ---------------------
  // MODULES
  // ---------------------
  async listModules(courseId: number): Promise<CanvasModule[]> {
    const response = await this.client.get(`/courses/${courseId}/modules`);
    return response.data;
  }

  async getModule(courseId: number, moduleId: number): Promise<CanvasModule> {
    const response = await this.client.get(`/courses/${courseId}/modules/${moduleId}`);
    return response.data;
  }

  async listModuleItems(courseId: number, moduleId: number): Promise<CanvasModuleItem[]> {
    const response = await this.client.get(`/courses/${courseId}/modules/${moduleId}/items`);
    return response.data;
  }

  async getModuleItem(courseId: number, moduleId: number, itemId: number): Promise<CanvasModuleItem> {
    const response = await this.client.get(`/courses/${courseId}/modules/${moduleId}/items/${itemId}`);
    return response.data;
  }

  // ---------------------
  // DISCUSSION TOPICS (FORUMS)
  // ---------------------
  async listDiscussionTopics(courseId: number): Promise<CanvasDiscussionTopic[]> {
    const response = await this.client.get(`/courses/${courseId}/discussion_topics`);
    return response.data;
  }

  async getDiscussionTopic(courseId: number, topicId: number): Promise<CanvasDiscussionTopic> {
    const response = await this.client.get(`/courses/${courseId}/discussion_topics/${topicId}`);
    return response.data;
  }

  // ---------------------
  // ANNOUNCEMENTS
  // ---------------------
  async listAnnouncements(courseId: number): Promise<CanvasAnnouncement[]> {
    // Announcements are discussion topics with type 'announcement'
    const response = await this.client.get(`/courses/${courseId}/discussion_topics`, {
      params: {
        type: 'announcement'
      }
    });
    return response.data;
  }

  // ---------------------
  // QUIZZES
  // ---------------------
  async listQuizzes(courseId: number): Promise<CanvasQuiz[]> {
    const response = await this.client.get(`/courses/${courseId}/quizzes`);
    return response.data;
  }

  async getQuiz(courseId: number, quizId: number): Promise<CanvasQuiz> {
    const response = await this.client.get(`/courses/${courseId}/quizzes/${quizId}`);
    return response.data;
  }

  async createQuiz(courseId: number, quizData: Partial<CanvasQuiz>): Promise<CanvasQuiz> {
    const response = await this.client.post(`/courses/${courseId}/quizzes`, {
      quiz: quizData
    });
    return response.data;
  }

  async updateQuiz(courseId: number, quizId: number, quizData: Partial<CanvasQuiz>): Promise<CanvasQuiz> {
    const response = await this.client.put(`/courses/${courseId}/quizzes/${quizId}`, {
      quiz: quizData
    });
    return response.data;
  }

  async deleteQuiz(courseId: number, quizId: number): Promise<void> {
    await this.client.delete(`/courses/${courseId}/quizzes/${quizId}`);
  }

  // ---------------------
  // FILES
  // ---------------------
  async listFiles(courseId: number): Promise<any[]> {
    // Replace 'any' with appropriate CanvasFile interface if defined
    const response = await this.client.get(`/courses/${courseId}/files`);
    return response.data;
  }

  async getFile(fileId: number): Promise<any> {
    // Replace 'any' with appropriate CanvasFile interface if defined
    const response = await this.client.get(`/files/${fileId}`);
    return response.data;
  }

  // ---------------------
  // SCOPES
  // ---------------------
  /**
   * List scopes for a given account.
   * This endpoint is BETA and may change.
   *
   * GET /api/v1/accounts/:account_id/scopes
   * Optional parameter: group_by (e.g., 'resource_name')
   */
  async listTokenScopes(accountId: number, groupBy?: string): Promise<CanvasScope[]> {
    const params: Record<string, string> = {};
    if (groupBy) {
      params.group_by = groupBy;
    }

    const response = await this.client.get(`/accounts/${accountId}/scopes`, { params });
    return response.data;
  }

  // ---------------------
  // ASSIGNMENT SUBMISSIONS
  // ---------------------
  async submitAssignment(args: {
    course_id: number;
    assignment_id: number;
    user_id: number;
    submission_type: string;
    body?: string;
  }): Promise<CanvasAssignmentSubmission> {
    const { course_id, assignment_id, user_id, submission_type, body } = args;
    const response = await this.client.post(
      `/courses/${course_id}/assignments/${assignment_id}/submissions/${user_id}`,
      {
        submission: {
          submission_type,
          body
        }
      }
    );
    return response.data;
  }
}
