import { LessonPlan } from "@prisma/client";
import {
  ILessonPlanRepository,
  CreateLessonPlanData,
  UpdateLessonPlanData,
} from "../../../../core/interfaces/ILessonPlanRepository";
import { prisma } from "../client";

export class PrismaLessonPlanRepository implements ILessonPlanRepository {
  async create(data: CreateLessonPlanData): Promise<LessonPlan> {
    return prisma.lessonPlan.create({
      data: {
        title: data.title,
        originalFileName: data.originalFileName,
        originalFilePath: data.originalFilePath,
        objectives: data.objectives || null,
        content: data.content || null,
        methodology: data.methodology || null,
        activities: data.activities || null,
        resources: data.resources || null,
        evaluation: data.evaluation || null,
        observations: data.observations || null,
      },
    });
  }

  async findById(id: string): Promise<LessonPlan | null> {
    return prisma.lessonPlan.findUnique({
      where: { id },
    });
  }

  async update(data: UpdateLessonPlanData): Promise<LessonPlan> {
    const { id, ...updateData } = data;
    return prisma.lessonPlan.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.lessonPlan.delete({
      where: { id },
    });
  }

  async findAll(id?: string): Promise<LessonPlan[]> {
    return prisma.lessonPlan.findMany({
      where: id ? { id } : {},
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
