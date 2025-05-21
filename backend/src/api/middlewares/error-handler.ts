import { NextFunction, Response } from "express";
import { AppError } from "../../shared/errors/AppError";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error("Global Error Handler caught an error:", err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
    return;
  }

  if (err.name === "MulterError") {
    let message = "File upload error.";
    if (err.message === "File too large") message = "File is too large.";
    res.status(400).json({
      status: "error",
      message,
      code: (err as any).code,
    });
    return;
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    status: "error",
    message: "Internal server error. Please try again later.",
    ...(process.env.NODE_ENV === "development" && {
      error_details: err.message,
      stack: err.stack,
    }),
  });
}
