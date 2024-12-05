// src/client.ts
import axios from 'axios';
import { CanvasAPIError } from './types.js';
export class CanvasClient {
    constructor(token, domain) {
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
    getNextPageUrl(linkHeader) {
        const links = linkHeader.split(',');
        const nextLink = links.find(link => link.includes('rel="next"'));
        if (!nextLink)
            return null;
        const match = nextLink.match(/<(.+?)>/);
        return match ? match[1] : null;
    }
    // Courses
    async listCourses() {
        const response = await this.client.get('/courses', {
            params: {
                include: ['total_students', 'teachers']
            }
        });
        return response.data;
    }
    async getCourse(courseId) {
        const response = await this.client.get(`/courses/${courseId}`, {
            params: {
                include: ['total_students', 'teachers']
            }
        });
        return response.data;
    }
    async createCourse(args) {
        const response = await this.client.post('/courses', {
            course: args
        });
        return response.data;
    }
    async updateCourse(args) {
        const { course_id, ...courseData } = args;
        const response = await this.client.put(`/courses/${course_id}`, {
            course: courseData
        });
        return response.data;
    }
    async deleteCourse(courseId) {
        await this.client.delete(`/courses/${courseId}`);
    }
    // Assignments
    async listAssignments(courseId) {
        const response = await this.client.get(`/courses/${courseId}/assignments`);
        return response.data;
    }
    async getAssignment(courseId, assignmentId) {
        const response = await this.client.get(`/courses/${courseId}/assignments/${assignmentId}`);
        return response.data;
    }
    async createAssignment(args) {
        const { course_id, ...assignmentData } = args;
        const response = await this.client.post(`/courses/${course_id}/assignments`, {
            assignment: assignmentData
        });
        return response.data;
    }
    async updateAssignment(args) {
        const { course_id, assignment_id, ...assignmentData } = args;
        const response = await this.client.put(`/courses/${course_id}/assignments/${assignment_id}`, { assignment: assignmentData });
        return response.data;
    }
    async deleteAssignment(courseId, assignmentId) {
        await this.client.delete(`/courses/${courseId}/assignments/${assignmentId}`);
    }
    // Submissions
    async getSubmissions(courseId, assignmentId) {
        const response = await this.client.get(`/courses/${courseId}/assignments/${assignmentId}/submissions`);
        return response.data;
    }
    async submitGrade(args) {
        const { course_id, assignment_id, user_id, grade, comment } = args;
        const response = await this.client.put(`/courses/${course_id}/assignments/${assignment_id}/submissions/${user_id}`, {
            submission: {
                posted_grade: grade,
                comment: { text_comment: comment }
            }
        });
        return response.data;
    }
    // Users and Enrollments
    async listUsers(courseId) {
        const response = await this.client.get(`/courses/${courseId}/users`, {
            params: {
                include: ['email', 'enrollments']
            }
        });
        return response.data;
    }
    async getEnrollments(courseId) {
        const response = await this.client.get(`/courses/${courseId}/enrollments`);
        return response.data;
    }
    async enrollUser(args) {
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
    async unenrollUser(courseId, enrollmentId) {
        await this.client.delete(`/courses/${courseId}/enrollments/${enrollmentId}`);
    }
    // Grades
    async getCourseGrades(courseId) {
        const response = await this.client.get(`/courses/${courseId}/enrollments`, {
            params: {
                include: ['grades']
            }
        });
        return response.data;
    }
}
