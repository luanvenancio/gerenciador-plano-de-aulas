export interface ExtractedLessonPlanData {
  objectives?: string | null;
  content?: string | null;
  methodology?: string | null;
  activities?: string | null;
  resources?: string | null;
  evaluation?: string | null;
  observations?: string | null;
  [key: string]: string | null | undefined;
}

export interface ILlmService {
  extractDataFromText(text: string): Promise<ExtractedLessonPlanData>;
}
