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
