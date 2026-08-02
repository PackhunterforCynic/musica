export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class RoomError extends AppError {
  constructor(message: string, code = 'ROOM_ERROR', details?: any) {
    super(message, 404, code, details);
  }
}

export class PermissionError extends AppError {
  constructor(message: string = 'Insufficient permissions for this action', details?: any) {
    super(message, 403, 'PERMISSION_ERROR', details);
  }
}

export class MediaError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, 'MEDIA_ERROR', details);
  }
}

export class SocketError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'SOCKET_ERROR', details);
  }
}
