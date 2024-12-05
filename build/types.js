// src/types.ts
/**
 * Error types
 */
export class CanvasAPIError extends Error {
    constructor(message, statusCode, response) {
        super(message);
        this.statusCode = statusCode;
        this.response = response;
        this.name = 'CanvasAPIError';
    }
}
export class CanvasValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CanvasValidationError';
    }
}
/**
 * Validation utilities
 */
export function isValidId(id) {
    return Number.isInteger(id) && id > 0;
}
export function validateCourseId(id) {
    if (!isValidId(id)) {
        throw new CanvasValidationError(`Invalid course ID: ${id}`);
    }
    return id;
}
export function validateAssignmentId(id) {
    if (!isValidId(id)) {
        throw new CanvasValidationError(`Invalid assignment ID: ${id}`);
    }
    return id;
}
export function validateUserId(id) {
    if (!isValidId(id)) {
        throw new CanvasValidationError(`Invalid user ID: ${id}`);
    }
    return id;
}
export function validateEnrollmentId(id) {
    if (!isValidId(id)) {
        throw new CanvasValidationError(`Invalid enrollment ID: ${id}`);
    }
    return id;
}
