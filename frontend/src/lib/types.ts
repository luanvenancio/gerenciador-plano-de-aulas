export interface LessonPlan {
  id: string;
  title?: string | null;
  originalFileName: string;
  originalFilePath: string;
  newPdfFilePath?: string | null;

  objectives?: string | null;
  content?: string | null;
  methodology?: string | null;
  activities?: string | null;
  resources?: string | null;
  evaluation?: string | null;
  observations?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface LessonPlanResponse {
  lessonPlan: LessonPlan;
  // extractedData?: Partial<LessonPlan>;
}

export type LessonPlanListResponse = LessonPlan[];

export type LessonPlanUpdatePayload = Pick<
  LessonPlan,
  | "title"
  | "objectives"
  | "content"
  | "methodology"
  | "activities"
  | "resources"
  | "evaluation"
  | "observations"
>;

export enum PdfLayoutType {
  STANDARD = "standard",
  COMPACT = "compact",
}

export const pdfLayoutTypeOptions = [
  { value: PdfLayoutType.STANDARD, label: "Padrão" },
  { value: PdfLayoutType.COMPACT, label: "Compacto" },
];
