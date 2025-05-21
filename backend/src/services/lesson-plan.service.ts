import { LessonPlan } from "@prisma/client";
import { AppError } from "../shared/errors/AppError";
import {
  IFileStorageService,
  UploadedFile,
} from "../core/interfaces/IFileStorageService";
import { IDocumentParserService } from "../core/interfaces/IDocumentParserService";
import {
  ILlmService,
  ExtractedLessonPlanData,
} from "../core/interfaces/ILlmService";
import {
  IPdfGeneratorService,
  PdfLayoutType,
} from "../core/interfaces/IPdfGeneratorService";
import {
  ILessonPlanRepository,
  CreateLessonPlanData,
} from "../core/interfaces/ILessonPlanRepository";

export interface CreateLessonPlanInput {
  file: UploadedFile;
  title?: string;
}

export interface FinalizeLessonPlanInput {
  lessonPlanId: string;
  formData: Partial<
    Omit<
      LessonPlan,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "originalFileName"
      | "originalFilePath"
      | "newPdfFilePath"
    >
  >;
  layoutType?: PdfLayoutType;
}

export interface LessonPlanProcessingResult {
  lessonPlan: LessonPlan;
  extractedData?: ExtractedLessonPlanData;
}

export class LessonPlanService {
  constructor(
    private fileStorageService: IFileStorageService,
    private documentParserService: IDocumentParserService,
    private llmService: ILlmService,
    private lessonPlanRepository: ILessonPlanRepository,
    private pdfGeneratorService: IPdfGeneratorService
  ) {}

  async processUploadedFileAndExtractData(
    input: CreateLessonPlanInput
  ): Promise<LessonPlanProcessingResult> {
    if (!input.file) {
      throw new AppError("No file uploaded.", 400);
    }

    const { filePath: originalFilePath, fileName: originalFileName } =
      await this.fileStorageService.saveFile(input.file, "originals");

    const initialLessonPlanData: CreateLessonPlanData = {
      title:
        input.title ||
        input.file.originalname.split(".").slice(0, -1).join("."),
      originalFileName,
      originalFilePath,
    };
    let lessonPlan = await this.lessonPlanRepository.create(
      initialLessonPlanData
    );

    const textContent = await this.documentParserService.parse(
      originalFilePath,
      input.file.mimetype
    );

    if (!textContent.trim()) {
      return {
        lessonPlan,
        extractedData: {
          objectives: null,
          content: null,
          methodology: null,
          activities: null,
          resources: null,
          evaluation: null,
          observations: null,
        },
      };
    }

    const extractedData =
      await this.llmService.extractDataFromText(textContent);

    lessonPlan = await this.lessonPlanRepository.update({
      id: lessonPlan.id,
      objectives: extractedData.objectives,
      content: extractedData.content,
      methodology: extractedData.methodology,
      activities: extractedData.activities,
      resources: extractedData.resources,
      evaluation: extractedData.evaluation,
      observations: extractedData.observations,
    });

    return { lessonPlan, extractedData };
  }

  async finalizeAndGeneratePdf(
    input: FinalizeLessonPlanInput
  ): Promise<LessonPlan> {
    const { lessonPlanId, formData, layoutType } = input;

    let lessonPlan = await this.lessonPlanRepository.findById(lessonPlanId);
    if (!lessonPlan) {
      throw new AppError("Lesson plan not found.", 404);
    }

    const updateData: Partial<LessonPlan> = { ...formData };

    lessonPlan = await this.lessonPlanRepository.update({
      id: lessonPlanId,
      ...updateData,
    });

    const { filePath: newPdfFilePath } =
      await this.pdfGeneratorService.generatePdf(lessonPlan, layoutType);

    lessonPlan = await this.lessonPlanRepository.update({
      id: lessonPlanId,
      newPdfFilePath,
    });

    return lessonPlan;
  }

  async getLessonPlanById(id: string): Promise<LessonPlan | null> {
    return this.lessonPlanRepository.findById(id);
  }

  async getAllLessonPlan(): Promise<LessonPlan[]> {
    const lessonPlans = await this.lessonPlanRepository.findAll();
    return lessonPlans ?? [];
  }

  async deleteLessonById(id: string): Promise<void> {
    const lessonPlan = await this.getLessonPlanById(id);

    if (!lessonPlan) {
      throw new AppError("Plano não enctrado");
    }

    if (lessonPlan.originalFilePath) {
      try {
        await this.fileStorageService.deleteFile(lessonPlan.originalFilePath);
      } catch (error) {
        console.error(
          `LessonPlanService: Failed to delete original file ${lessonPlan.originalFilePath} for lesson plan ${id}. Error:`,
          error
        );
      }
    }
    if (lessonPlan.newPdfFilePath) {
      try {
        await this.fileStorageService.deleteFile(lessonPlan.newPdfFilePath);
      } catch (error) {
        console.error(
          `LessonPlanService: Failed to delete generated PDF ${lessonPlan.newPdfFilePath} for lesson plan ${id}. Error:`,
          error
        );
      }
    }

    await this.lessonPlanRepository.delete(id);
  }
}
