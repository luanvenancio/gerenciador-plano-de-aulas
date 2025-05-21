import { Request, Response, NextFunction, RequestHandler } from "express";
import { validate, ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";
import { AppError } from "@shared/errors/AppError";

type ClassType<T> = { new (...args: any[]): T };

export function validationMiddleware<T extends object>(
  dtoClass: ClassType<T>,
  source: "body" | "params" | "query" = "body"
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req[source];

    const dtoInstance = plainToInstance(dtoClass, dataToValidate, {
      enableImplicitConversion: true,
    });

    const errors: ValidationError[] = await validate(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      const message = errors
        .map((error: ValidationError) =>
          Object.values(error.constraints || {}).join(", ")
        )
        .join("; ");
      return next(new AppError(message, 400));
    }

    req[source] = dtoInstance;
    next();
  };
}
