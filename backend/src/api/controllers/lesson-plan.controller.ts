import { Request, Response, NextFunction } from "express";
import { access } from "fs/promises";
import { LessonPlanService } from "../../services/lesson-plan.service";
import { AppError } from "../../shared/errors/AppError";
import { UploadedFile } from "../../core/interfaces/IFileStorageService";
import path from "path";
import {
  FinalizeAndGenerateBodyDto,
  LessonPlanIdParamDto,
  UploadAndExtractBodyDto,
} from "@core/dtos/lesson-plan/lesson-plan.dto";

export class LessonPlanController {
  constructor(private lessonPlanService: LessonPlanService) {}

  async uploadAndExtract(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { file } = req;
      const { title } = req.body as UploadAndExtractBodyDto;

      if (!file) {
        throw new AppError("File is required for upload.", 400);
      }
      const uploadedFile = file as UploadedFile;

      const result =
        await this.lessonPlanService.processUploadedFileAndExtractData({
          file: uploadedFile,
          title,
        });
      res.status(201).json(result);
    } catch (error) {
      console.error("Error in uploadAndExtract controller:", error);
      next(error);
    }
  }

  async finalizeAndGenerate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.params as unknown as LessonPlanIdParamDto;
      const { id: lessonPlanId } = params;
      const { formData, layoutType } = req.body as FinalizeAndGenerateBodyDto;

      if (!lessonPlanId) {
        throw new AppError(
          "Lesson plan ID is required in URL parameters.",
          400
        );
      }

      const lessonPlan = await this.lessonPlanService.finalizeAndGeneratePdf({
        lessonPlanId,
        formData,
        layoutType,
      });
      res.status(200).json(lessonPlan);
    } catch (error) {
      console.error(
        `Error in finalizeAndGenerate controller for ID ${req.params.id}:`,
        error
      );
      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.params as unknown as LessonPlanIdParamDto;
      const { id } = params;
      if (!id) {
        throw new AppError(
          "Lesson plan ID is required in URL parameters.",
          400
        );
      }

      const lessonPlan = await this.lessonPlanService.getLessonPlanById(id);
      if (!lessonPlan) {
        throw new AppError("Lesson plan not found.", 404);
      }
      res.status(200).json(lessonPlan);
    } catch (error) {
      console.error(
        `Error in getById controller for ID ${req.params.id}:`,
        error
      );
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lessonPlans = await this.lessonPlanService.getAllLessonPlan();
      res.status(200).json(lessonPlans);
    } catch (error) {
      console.error("Error in getAll controller:", error);
      next(error);
    }
  }

  async downloadGeneratedPdf(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.params as unknown as LessonPlanIdParamDto;
      const { id } = params;
      if (!id) {
        throw new AppError("Lesson plan ID is required for download.", 400);
      }

      const lessonPlan = await this.lessonPlanService.getLessonPlanById(id);

      if (!lessonPlan) {
        throw new AppError("Lesson plan not found.", 404);
      }
      if (!lessonPlan.newPdfFilePath) {
        throw new AppError(
          "Generated PDF path is missing for this lesson plan.",
          404
        );
      }

      try {
        await access(lessonPlan.newPdfFilePath);
      } catch (fileAccessError) {
        console.error(
          `Generated PDF file not accessible at path: ${lessonPlan.newPdfFilePath} for lesson plan ${id}`,
          fileAccessError
        );
        throw new AppError(
          "Generated PDF file is missing or inaccessible on the server.",
          500
        );
      }

      const downloadFileName = lessonPlan.title
        ? `${lessonPlan.title
            .replace(/[^a-z0-9\s-]/gi, "_")
            .replace(/\s+/g, "_")
            .toLowerCase()}_padronizado.pdf`
        : `plano_aula_${id}_padronizado.pdf`;

      res.download(lessonPlan.newPdfFilePath, downloadFileName, (err) => {
        if (err) {
          console.error(
            `Error during res.download for lesson plan ${id}, file ${lessonPlan.newPdfFilePath}:`,
            err
          );
          if (!res.headersSent) {
            next(
              new AppError(
                "Could not download the file due to a server error.",
                500
              )
            );
          }
        } else {
          console.log(`File download initiated successfully ${id}.`);
        }
      });
    } catch (error) {
      console.error(
        `Error in downloadGeneratedPdf controller for ID ${req.params.id}:`,
        error
      );
      next(error);
    }
  }

  async downloadOriginalFile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.params as unknown as LessonPlanIdParamDto;
      const { id } = params;
      if (!id) {
        throw new AppError("Lesson plan ID is required for download.", 400);
      }

      const lessonPlan = await this.lessonPlanService.getLessonPlanById(id);

      if (!lessonPlan) {
        throw new AppError("Lesson plan not found.", 404);
      }
      if (!lessonPlan.originalFilePath) {
        throw new AppError(
          "Original file path is missing for this lesson plan.",
          404
        );
      }

      try {
        await access(lessonPlan.originalFilePath);
      } catch (fileAccessError) {
        console.error(
          `Original file not accessible at path: ${lessonPlan.originalFilePath} for lesson plan ${id}`,
          fileAccessError
        );
        throw new AppError(
          "Original file is missing or inaccessible on the server.",
          500
        );
      }

      const downloadFileName = lessonPlan.originalFileName;

      res.download(lessonPlan.originalFilePath, downloadFileName, (err) => {
        if (err) {
          console.error(
            `Error during res.download for original file, lesson plan ${id}, file ${lessonPlan.originalFilePath}:`,
            err
          );
          if (!res.headersSent) {
            next(
              new AppError(
                "Could not download the original file due to a server error.",
                500
              )
            );
          }
        } else {
          console.log(`Original file download initiated successfully ${id}.`);
        }
      });
    } catch (error) {
      console.error(
        `Error in downloadOriginalFile controller for ID ${req.params.id}:`,
        error
      );
      next(error);
    }
  }

  async viewGeneratedPdf(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.params as unknown as LessonPlanIdParamDto;
      const { id } = params;
      if (!id) {
        throw new AppError("Lesson plan ID is required for viewing.", 400);
      }

      const lessonPlan = await this.lessonPlanService.getLessonPlanById(id);

      if (!lessonPlan) {
        throw new AppError("Lesson plan not found.", 404);
      }
      if (!lessonPlan.newPdfFilePath) {
        throw new AppError(
          "Generated PDF path is missing for this lesson plan.",
          404
        );
      }

      try {
        await access(lessonPlan.newPdfFilePath);
      } catch (fileAccessError) {
        console.error(
          `Generated PDF file not accessible at path: ${lessonPlan.newPdfFilePath} for lesson plan ${id}`,
          fileAccessError
        );
        throw new AppError(
          "Generated PDF file is missing or inaccessible on the server.",
          500
        );
      }

      res.setHeader("Content-Type", "application/pdf");
      res.sendFile(lessonPlan.newPdfFilePath, (err) => {
        if (err) {
          console.error(
            `Error during res.sendFile for generated PDF, lesson plan ${id}, file ${lessonPlan.newPdfFilePath}:`,
            err
          );
          if (!res.headersSent) {
            next(
              new AppError(
                "Could not send the file for viewing due to a server error.",
                500
              )
            );
          }
        } else {
          console.log(`Generated PDF  ${id}.`);
        }
      });
    } catch (error) {
      console.error(
        `Error in viewGeneratedPdf controller for ID ${req.params.id}:`,
        error
      );
      next(error);
    }
  }

  async viewOriginalFile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.params as unknown as LessonPlanIdParamDto;
      const { id } = params;
      if (!id) {
        throw new AppError("Lesson plan ID is required for viewing.", 400);
      }

      const lessonPlan = await this.lessonPlanService.getLessonPlanById(id);

      if (!lessonPlan) {
        throw new AppError("Lesson plan not found.", 404);
      }
      if (!lessonPlan.originalFilePath || !lessonPlan.originalFileName) {
        throw new AppError(
          "Original file path or name is missing for this lesson plan.",
          404
        );
      }

      try {
        await access(lessonPlan.originalFilePath);
      } catch (fileAccessError) {
        console.error(
          `Original file not accessible at path: ${lessonPlan.originalFilePath} for lesson plan ${id}`,
          fileAccessError
        );
        throw new AppError(
          "Original file is missing or inaccessible on the server.",
          500
        );
      }

      const fileExtension = path
        .extname(lessonPlan.originalFileName)
        .toLowerCase();
      let contentType = "application/octet-stream";
      if (fileExtension === ".pdf") {
        contentType = "application/pdf";
      } else if (fileExtension === ".docx") {
        if (fileExtension === ".docx") {
          console.warn(
            `Attempting to view DOCX file inline for lesson plan ${id}, this will likely result in a download.`
          );
          return this.downloadOriginalFile(req, res, next);
        }
      } else if ([".jpg", ".jpeg"].includes(fileExtension)) {
        contentType = "image/jpeg";
      } else if (fileExtension === ".png") {
        contentType = "image/png";
      }

      res.setHeader("Content-Type", contentType);
      res.sendFile(lessonPlan.originalFilePath, (err) => {
        if (err) {
          console.error(
            `Error during res.sendFile for original file, lesson plan ${id}, file ${lessonPlan.originalFilePath}:`,
            err
          );
          if (!res.headersSent) {
            next(
              new AppError(
                "Could not send the original file for viewing due to a server error.",
                500
              )
            );
          }
        } else {
          console.log(`Original file sent ${id}.`);
        }
      });
    } catch (error) {
      console.error(
        `Error in viewOriginalFile controller for ID ${req.params.id}:`,
        error
      );
      next(error);
    }
  }

  async deleteById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = req.params as unknown as LessonPlanIdParamDto;
      const { id } = params;
      if (!id) {
        throw new AppError("Lesson plan ID is required for deletion.", 400);
      }

      await this.lessonPlanService.deleteLessonById(id);

      res.status(204).send();
    } catch (error) {
      console.error(
        `Error in deleteById controller for ID ${req.params.id}:`,
        error
      );
      next(error);
    }
  }
}
