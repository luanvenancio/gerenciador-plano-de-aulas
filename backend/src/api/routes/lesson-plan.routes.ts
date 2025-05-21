import { Router } from "express";
import { LessonPlanController } from "../controllers/lesson-plan.controller";
import { uploadMiddleware } from "../middlewares/upload.middleware";

import { PrismaLessonPlanRepository } from "../../infra/database/prisma/repositories/PrismaLessonPlanRepository";
import { LessonPlanService } from "../../services/lesson-plan.service";
import { LocalFileStorageService } from "infra/file-storage/local-file-storage.service";
import { GeminiLlmService } from "infra/llm/gemini-llm.service";
import { DocxParser } from "infra/parsing/docx-parse";
import { PdfParser } from "infra/parsing/pdf-parser";
import { DocumentParserService } from "services/document-parser.service";
import { MyPdfGeneratorService } from "@infra/pdf-generation/pdf-generator.service";
import { validationMiddleware } from "@api/middlewares/validation.middleware";
import {
  FinalizeAndGenerateBodyDto,
  LessonPlanIdParamDto,
  UploadAndExtractBodyDto,
} from "@core/dtos/lesson-plan/lesson-plan.dto";

const prismaLessonPlanRepository = new PrismaLessonPlanRepository();
const localFileStorageService = new LocalFileStorageService();
const pdfParser = new PdfParser();
const docxParser = new DocxParser();
const documentParserService = new DocumentParserService(pdfParser, docxParser);

let geminiLlmService: GeminiLlmService;
try {
  geminiLlmService = new GeminiLlmService();
} catch (error) {
  console.error(
    "Failed to initialize GeminiLlmService during DI setup:",
    error
  );
  throw new Error(
    `Critical setup failure: GeminiLlmService could not be initialized. ${
      error instanceof Error ? error.message : String(error)
    }`
  );
}

// const pdfLibGeneratorService = new PdfLibGeneratorService();
const pdfLibGeneratorService = new MyPdfGeneratorService();

const lessonPlanService = new LessonPlanService(
  localFileStorageService,
  documentParserService,
  geminiLlmService,
  prismaLessonPlanRepository,
  pdfLibGeneratorService
);

const lessonPlanController = new LessonPlanController(lessonPlanService);

const lessonPlanRouter = Router();

lessonPlanRouter.post(
  "/",
  uploadMiddleware.single("lessonPlanFile"),
  validationMiddleware(UploadAndExtractBodyDto, "body"),
  (req, res, next) => lessonPlanController.uploadAndExtract(req, res, next)
);

lessonPlanRouter.put(
  "/:id/finalize",
  validationMiddleware(LessonPlanIdParamDto, "params"),
  validationMiddleware(FinalizeAndGenerateBodyDto, "body"),
  (req, res, next) => lessonPlanController.finalizeAndGenerate(req, res, next)
);

lessonPlanRouter.get(
  "/",

  (req, res, next) => lessonPlanController.getAll(req, res, next)
);

lessonPlanRouter.get(
  "/:id",
  validationMiddleware(LessonPlanIdParamDto, "params"),
  (req, res, next) => lessonPlanController.getById(req, res, next)
);

lessonPlanRouter.get(
  "/:id/download-pdf",
  validationMiddleware(LessonPlanIdParamDto, "params"),
  (req, res, next) => lessonPlanController.downloadGeneratedPdf(req, res, next)
);

lessonPlanRouter.get(
  "/:id/download-original",
  validationMiddleware(LessonPlanIdParamDto, "params"),
  (req, res, next) => lessonPlanController.downloadOriginalFile(req, res, next)
);

lessonPlanRouter.get(
  "/:id/view-generated-pdf",
  validationMiddleware(LessonPlanIdParamDto, "params"),
  (req, res, next) => lessonPlanController.viewGeneratedPdf(req, res, next)
);

lessonPlanRouter.get(
  "/:id/view-original",
  validationMiddleware(LessonPlanIdParamDto, "params"),
  (req, res, next) => lessonPlanController.viewOriginalFile(req, res, next)
);

lessonPlanRouter.delete(
  "/:id",
  validationMiddleware(LessonPlanIdParamDto, "params"),
  (req, res, next) => lessonPlanController.deleteById(req, res, next)
);

export { lessonPlanRouter };
