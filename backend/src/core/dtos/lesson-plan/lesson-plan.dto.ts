import {
  IsString,
  IsOptional,
  IsNotEmptyObject,
  IsObject,
  ValidateNested,
  IsEnum,
  MaxLength,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { PdfLayoutType } from "@core/interfaces/IPdfGeneratorService";
import { LessonPlan } from "@prisma/client";

export class UploadAndExtractBodyDto {
  @IsOptional()
  @IsString({ message: "O título deve ser uma string." })
  @MinLength(1, { message: "O título não pode ser vazio se fornecido." })
  @MaxLength(255, { message: "O título não pode exceder 255 caracteres." })
  title?: string;
}

export class LessonPlanIdParamDto {
  @IsString({ message: "O ID do plano de aula deve ser uma string." })
  @MinLength(1, { message: "O ID do plano de aula é obrigatório." })
  id!: string;
}

class FinalizeFormDataDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  objectives?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  methodology?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  activities?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resources?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  evaluation?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string | null;
}

export class FinalizeAndGenerateBodyDto {
  @IsObject({ message: "formData deve ser um objeto." })
  @IsNotEmptyObject({}, { message: "formData não pode ser um objeto vazio." })
  @ValidateNested()
  @Type(() => FinalizeFormDataDto)
  formData!: Partial<
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

  @IsOptional()
  @IsEnum(PdfLayoutType, { message: "LayoutType inválido." })
  layoutType?: PdfLayoutType;
}
