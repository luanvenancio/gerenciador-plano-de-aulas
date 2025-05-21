import { LessonPlan } from "@prisma/client";

export interface CreateLessonPlanData {
  originalFileName: string;
  originalFilePath: string;
  title?: string;
  objectives?: string | null;
  content?: string | null;
  methodology?: string | null;
  activities?: string | null;
  resources?: string | null;
  evaluation?: string | null;
  observations?: string | null;
}

export interface UpdateLessonPlanData
  extends Partial<Omit<LessonPlan, "id" | "createdAt" | "updatedAt">> {
  id: string;
}

export interface ILessonPlanRepository {
  create(data: CreateLessonPlanData): Promise<LessonPlan>;
  findById(id: string): Promise<LessonPlan | null>;
  update(data: UpdateLessonPlanData): Promise<LessonPlan>;
  delete(id: string): Promise<void>;
  findAll(id?: string): Promise<LessonPlan[]>;
}
