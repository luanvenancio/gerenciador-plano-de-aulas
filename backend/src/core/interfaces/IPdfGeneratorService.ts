import { LessonPlan } from "@prisma/client";

export interface IPdfGeneratorService {
  generatePdf(
    data: LessonPlan,
    templateName?: string
  ): Promise<{ filePath: string; fileName: string }>;
}

export enum PdfLayoutType {
  STANDARD = "standard",
  COMPACT = "compact",
}
