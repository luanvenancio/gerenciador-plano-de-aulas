import { IDocumentParserService } from "@core/interfaces/IDocumentParserService";
import {
  IFileStorageService,
  UploadedFile,
} from "@core/interfaces/IFileStorageService";
import {
  ILessonPlanRepository,
  CreateLessonPlanData,
} from "@core/interfaces/ILessonPlanRepository";
import {
  ILlmService,
  ExtractedLessonPlanData,
} from "@core/interfaces/ILlmService";
import {
  IPdfGeneratorService,
  PdfLayoutType,
} from "@core/interfaces/IPdfGeneratorService";
import { LessonPlan } from "@prisma/client";
import { AppError } from "@shared/errors/AppError";
import {
  CreateLessonPlanInput,
  FinalizeLessonPlanInput,
  LessonPlanService,
} from "@services/lesson-plan.service";

const mockFileStorageService: jest.Mocked<IFileStorageService> = {
  saveFile: jest.fn(),
  deleteFile: jest.fn(),
};

const mockDocumentParserService: jest.Mocked<IDocumentParserService> = {
  parse: jest.fn(),
};

const mockLlmService: jest.Mocked<ILlmService> = {
  extractDataFromText: jest.fn(),
};

const mockLessonPlanRepository: jest.Mocked<ILessonPlanRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn().mockResolvedValue(undefined) as jest.Mock<
    Promise<void>,
    [string]
  >,
};

const mockPdfGeneratorService: jest.Mocked<IPdfGeneratorService> = {
  generatePdf: jest.fn(),
};

const mockUploadedFile: UploadedFile = {
  fieldname: "file",
  originalname: "test-document.docx",
  encoding: "7bit",
  mimetype:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  buffer: Buffer.from("test content"),
  size: 12345,
  destination: "/tmp",
  filename: "randomname.docx",
  path: "/tmp/randomname.docx",
};

const baseMockLessonPlan: LessonPlan = {
  id: "clp-id-001",
  title: "Initial Title",
  originalFileName: "initial.docx",
  originalFilePath: "originals/initial.docx",
  newPdfFilePath: null,
  objectives: "Initial objectives",
  content: "Initial content",
  methodology: "Initial methodology",
  activities: "Initial activities",
  resources: "Initial resources",
  evaluation: "Initial evaluation",
  observations: "Initial observations",
  createdAt: new Date("2023-01-01T10:00:00.000Z"),
  updatedAt: new Date("2023-01-01T10:00:00.000Z"),
};

const mockExtractedData: ExtractedLessonPlanData = {
  objectives: "Extracted objectives",
  content: "Extracted content",
  methodology: "Extracted methodology",
  activities: "Extracted activities",
  resources: "Extracted resources",
  evaluation: "Extracted evaluation",
  observations: "Extracted observations",
};

describe("LessonPlanService", () => {
  let lessonPlanService: LessonPlanService;

  beforeEach(() => {
    jest.clearAllMocks();
    lessonPlanService = new LessonPlanService(
      mockFileStorageService,
      mockDocumentParserService,
      mockLlmService,
      mockLessonPlanRepository,
      mockPdfGeneratorService
    );
  });

  describe("processUploadedFileAndExtractData", () => {
    const createInput: CreateLessonPlanInput = {
      file: mockUploadedFile,
      title: "Custom Test Title",
    };

    it("should throw AppError if no file is uploaded", async () => {
      const invalidInput = { title: "Some title" } as CreateLessonPlanInput;
      await expect(
        lessonPlanService.processUploadedFileAndExtractData(invalidInput)
      ).rejects.toThrow(new AppError("No file uploaded.", 400));
    });

    it("should process file, extract data, update, and return lesson plan with extracted data", async () => {
      const savedFileInfo = {
        filePath: "originals/uploaded-file.docx",
        fileName: "uploaded-file.docx",
      };
      const initialLessonPlanData: CreateLessonPlanData = {
        title: createInput.title!,
        originalFileName: savedFileInfo.fileName,
        originalFilePath: savedFileInfo.filePath,
      };
      const createdLessonPlan: LessonPlan = {
        ...baseMockLessonPlan,
        id: "lp-1",
        title: initialLessonPlanData.title ?? null,
        originalFileName: initialLessonPlanData.originalFileName,
        originalFilePath: initialLessonPlanData.originalFilePath,
        objectives: null,
        content: null,
        methodology: null,
        activities: null,
        resources: null,
        evaluation: null,
        observations: null,
        newPdfFilePath: null,
      };
      const textContent = "Parsed document content here.";
      const updatedLessonPlanWithExtractedData: LessonPlan = {
        ...createdLessonPlan,
        ...mockExtractedData,
      };

      mockFileStorageService.saveFile.mockResolvedValue(savedFileInfo);
      mockLessonPlanRepository.create.mockResolvedValue(createdLessonPlan);
      mockDocumentParserService.parse.mockResolvedValue(textContent);
      mockLlmService.extractDataFromText.mockResolvedValue(mockExtractedData);
      mockLessonPlanRepository.update.mockResolvedValue(
        updatedLessonPlanWithExtractedData
      );

      const result =
        await lessonPlanService.processUploadedFileAndExtractData(createInput);

      expect(mockFileStorageService.saveFile).toHaveBeenCalledWith(
        createInput.file,
        "originals"
      );
      expect(mockLessonPlanRepository.create).toHaveBeenCalledWith(
        initialLessonPlanData
      );
      expect(mockDocumentParserService.parse).toHaveBeenCalledWith(
        savedFileInfo.filePath,
        createInput.file.mimetype
      );
      expect(mockLlmService.extractDataFromText).toHaveBeenCalledWith(
        textContent
      );
      expect(mockLessonPlanRepository.update).toHaveBeenCalledWith({
        id: createdLessonPlan.id,
        ...mockExtractedData,
      });
      expect(result.lessonPlan).toEqual(updatedLessonPlanWithExtractedData);
      expect(result.extractedData).toEqual(mockExtractedData);
    });

    it("should use originalname for title if input.title is not provided", async () => {
      const fileOnlyInput: CreateLessonPlanInput = {
        file: { ...mockUploadedFile, originalname: "lesson.plan.file.pdf" },
      };
      const derivedTitle = "lesson.plan.file";
      const savedFileInfo = {
        filePath: "originals/lesson.plan.file.pdf",
        fileName: "lesson.plan.file.pdf",
      };
      const createdLessonPlan: LessonPlan = {
        ...baseMockLessonPlan,
        id: "lp-2",
        title: derivedTitle,
        originalFileName: savedFileInfo.fileName,
        originalFilePath: savedFileInfo.filePath,
      };

      mockFileStorageService.saveFile.mockResolvedValue(savedFileInfo);
      mockLessonPlanRepository.create.mockResolvedValue(createdLessonPlan);
      mockDocumentParserService.parse.mockResolvedValue("content");
      mockLlmService.extractDataFromText.mockResolvedValue(mockExtractedData);
      mockLessonPlanRepository.update.mockResolvedValue({
        ...createdLessonPlan,
        ...mockExtractedData,
      });

      await lessonPlanService.processUploadedFileAndExtractData(fileOnlyInput);

      expect(mockLessonPlanRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: derivedTitle })
      );
    });

    it("should handle empty text content from parser and return initial lesson plan with null extracted data", async () => {
      const savedFileInfo = {
        filePath: "originals/empty.docx",
        fileName: "empty.docx",
      };
      const initialLessonPlanData: CreateLessonPlanData = {
        title: createInput.title!,
        originalFileName: savedFileInfo.fileName,
        originalFilePath: savedFileInfo.filePath,
      };
      const createdLessonPlan: LessonPlan = {
        ...baseMockLessonPlan,
        id: "lp-3",
        title: initialLessonPlanData.title ?? null,
        originalFileName: initialLessonPlanData.originalFileName,
        originalFilePath: initialLessonPlanData.originalFilePath,
        objectives: null,
        content: null,
        methodology: null,
        activities: null,
        resources: null,
        evaluation: null,
        observations: null,
        newPdfFilePath: null,
      };
      const emptyTextContent = "   ";

      mockFileStorageService.saveFile.mockResolvedValue(savedFileInfo);
      mockLessonPlanRepository.create.mockResolvedValue(createdLessonPlan);
      mockDocumentParserService.parse.mockResolvedValue(emptyTextContent);

      const result =
        await lessonPlanService.processUploadedFileAndExtractData(createInput);

      expect(mockFileStorageService.saveFile).toHaveBeenCalled();
      expect(mockLessonPlanRepository.create).toHaveBeenCalled();
      expect(mockDocumentParserService.parse).toHaveBeenCalled();
      expect(mockLlmService.extractDataFromText).not.toHaveBeenCalled();
      expect(mockLessonPlanRepository.update).not.toHaveBeenCalled();
      expect(result.lessonPlan).toEqual(createdLessonPlan);
      expect(result.extractedData).toEqual({
        objectives: null,
        content: null,
        methodology: null,
        activities: null,
        resources: null,
        evaluation: null,
        observations: null,
      });
    });
  });

  describe("finalizeAndGeneratePdf", () => {
    const lessonPlanId = "lp-finalize-123";
    const formData: FinalizeLessonPlanInput["formData"] = {
      title: "Finalized Title",
      objectives: "Finalized Objectives",
      content: "Finalized Content",
    };
    const finalizeInput: FinalizeLessonPlanInput = {
      lessonPlanId,
      formData,
      layoutType: PdfLayoutType.STANDARD,
    };
    const existingLessonPlan: LessonPlan = {
      ...baseMockLessonPlan,
      id: lessonPlanId,
      title: "Old Title",
      originalFilePath: "path/to/existing.docx",
      originalFileName: "existing.docx",
    };

    it("should throw AppError if lesson plan is not found", async () => {
      mockLessonPlanRepository.findById.mockResolvedValue(null);
      await expect(
        lessonPlanService.finalizeAndGeneratePdf(finalizeInput)
      ).rejects.toThrow(new AppError("Lesson plan not found.", 404));
      expect(mockLessonPlanRepository.findById).toHaveBeenCalledWith(
        lessonPlanId
      );
    });

    it("should update with form data, generate PDF, update with PDF path, and return lesson plan", async () => {
      const updatedLessonPlanAfterForm: LessonPlan = {
        ...existingLessonPlan,
        ...formData,
      };
      const pdfInfo = {
        filePath: "generated/finalized.pdf",
        fileName: "finalized.pdf",
      };
      const finalLessonPlanWithPdf: LessonPlan = {
        ...updatedLessonPlanAfterForm,
        newPdfFilePath: pdfInfo.filePath,
      };

      mockLessonPlanRepository.findById.mockResolvedValue(existingLessonPlan);
      mockLessonPlanRepository.update
        .mockResolvedValueOnce(updatedLessonPlanAfterForm)
        .mockResolvedValueOnce(finalLessonPlanWithPdf);
      mockPdfGeneratorService.generatePdf.mockResolvedValue(pdfInfo);

      const result =
        await lessonPlanService.finalizeAndGeneratePdf(finalizeInput);

      expect(mockLessonPlanRepository.findById).toHaveBeenCalledWith(
        lessonPlanId
      );
      expect(mockLessonPlanRepository.update).toHaveBeenNthCalledWith(1, {
        id: lessonPlanId,
        ...formData,
      });
      expect(mockPdfGeneratorService.generatePdf).toHaveBeenCalledWith(
        updatedLessonPlanAfterForm,
        finalizeInput.layoutType
      );
      expect(mockLessonPlanRepository.update).toHaveBeenNthCalledWith(2, {
        id: lessonPlanId,
        newPdfFilePath: pdfInfo.filePath,
      });
      expect(result).toEqual(finalLessonPlanWithPdf);
    });
  });

  describe("getLessonPlanById", () => {
    const lessonPlanId = "lp-get-456";

    it("should return lesson plan if found", async () => {
      const foundLessonPlan: LessonPlan = {
        ...baseMockLessonPlan,
        id: lessonPlanId,
      };
      mockLessonPlanRepository.findById.mockResolvedValue(foundLessonPlan);

      const result = await lessonPlanService.getLessonPlanById(lessonPlanId);

      expect(mockLessonPlanRepository.findById).toHaveBeenCalledWith(
        lessonPlanId
      );
      expect(result).toEqual(foundLessonPlan);
    });

    it("should return null if lesson plan not found", async () => {
      mockLessonPlanRepository.findById.mockResolvedValue(null);

      const result = await lessonPlanService.getLessonPlanById(lessonPlanId);

      expect(mockLessonPlanRepository.findById).toHaveBeenCalledWith(
        lessonPlanId
      );
      expect(result).toBeNull();
    });
  });

  describe("getAllLessonPlan", () => {
    it("should return all lesson plans", async () => {
      const lessonPlans: LessonPlan[] = [
        { ...baseMockLessonPlan, id: "lp-all-1" },
        { ...baseMockLessonPlan, id: "lp-all-2" },
      ];
      mockLessonPlanRepository.findAll.mockResolvedValue(lessonPlans);

      const result = await lessonPlanService.getAllLessonPlan();

      expect(mockLessonPlanRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(lessonPlans);
    });

    it("should return an empty array if repository returns null", async () => {
      mockLessonPlanRepository.findAll.mockResolvedValue(null as any);
      const result = await lessonPlanService.getAllLessonPlan();
      expect(result).toEqual([]);
    });

    it("should return an empty array if repository returns an empty array", async () => {
      mockLessonPlanRepository.findAll.mockResolvedValue([]);
      const result = await lessonPlanService.getAllLessonPlan();
      expect(result).toEqual([]);
    });
  });

  describe("deleteLessonById", () => {
    const lessonPlanId = "lp-delete-789";
    const lessonPlanToDelete: LessonPlan = {
      ...baseMockLessonPlan,
      id: lessonPlanId,
      originalFilePath: "originals/to-delete.docx",
      originalFileName: "to-delete.docx",
      newPdfFilePath: "generated/to-delete.pdf",
    };

    it("should throw AppError if lesson plan not found", async () => {
      mockLessonPlanRepository.findById.mockResolvedValue(null);

      await expect(
        lessonPlanService.deleteLessonById(lessonPlanId)
      ).rejects.toThrow(new AppError("Plano não enctrado"));
      expect(mockLessonPlanRepository.findById).toHaveBeenCalledWith(
        lessonPlanId
      );
      expect(mockFileStorageService.deleteFile).not.toHaveBeenCalled();
      expect(mockLessonPlanRepository.delete).not.toHaveBeenCalled();
    });

    it("should delete lesson plan and associated files if they exist", async () => {
      mockLessonPlanRepository.findById.mockResolvedValue(lessonPlanToDelete);
      mockFileStorageService.deleteFile.mockResolvedValue(undefined);

      await lessonPlanService.deleteLessonById(lessonPlanId);

      expect(mockLessonPlanRepository.findById).toHaveBeenCalledWith(
        lessonPlanId
      );
      expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith(
        lessonPlanToDelete.originalFilePath
      );
      expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith(
        lessonPlanToDelete.newPdfFilePath!
      );
      expect(mockLessonPlanRepository.delete).toHaveBeenCalledWith(
        lessonPlanId
      );
    });

    it("should proceed with DB deletion even if original file deletion fails", async () => {
      mockLessonPlanRepository.findById.mockResolvedValue(lessonPlanToDelete);
      mockFileStorageService.deleteFile
        .mockImplementationOnce(async (filePath: string) => {
          if (filePath === lessonPlanToDelete.originalFilePath)
            throw new Error("Original delete failed");
          return undefined;
        })
        .mockResolvedValueOnce(undefined);
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await lessonPlanService.deleteLessonById(lessonPlanId);

      expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith(
        lessonPlanToDelete.originalFilePath
      );
      expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith(
        lessonPlanToDelete.newPdfFilePath!
      );
      expect(mockLessonPlanRepository.delete).toHaveBeenCalledWith(
        lessonPlanId
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `LessonPlanService: Failed to delete original file ${lessonPlanToDelete.originalFilePath} for lesson plan ${lessonPlanId}. Error:`,
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it("should proceed with DB deletion even if new PDF file deletion fails", async () => {
      mockLessonPlanRepository.findById.mockResolvedValue(lessonPlanToDelete);
      mockFileStorageService.deleteFile
        .mockResolvedValueOnce(undefined)
        .mockImplementationOnce(async (filePath: string | null) => {
          if (filePath === lessonPlanToDelete.newPdfFilePath)
            throw new Error("PDF delete failed");
          return undefined;
        });
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await lessonPlanService.deleteLessonById(lessonPlanId);

      expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith(
        lessonPlanToDelete.originalFilePath
      );
      expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith(
        lessonPlanToDelete.newPdfFilePath!
      );
      expect(mockLessonPlanRepository.delete).toHaveBeenCalledWith(
        lessonPlanId
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `LessonPlanService: Failed to delete generated PDF ${lessonPlanToDelete.newPdfFilePath} for lesson plan ${lessonPlanId}. Error:`,
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it("should not attempt to delete newPdfFile if its path is null", async () => {
      const lessonPlanWithNullPdfPath: LessonPlan = {
        ...baseMockLessonPlan,
        id: lessonPlanId,
        originalFilePath: "originals/some-file.docx",
        originalFileName: "some-file.docx",
        newPdfFilePath: null,
      };
      mockLessonPlanRepository.findById.mockResolvedValue(
        lessonPlanWithNullPdfPath
      );
      mockFileStorageService.deleteFile.mockResolvedValue(undefined);

      await lessonPlanService.deleteLessonById(lessonPlanId);

      expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith(
        lessonPlanWithNullPdfPath.originalFilePath
      );

      expect(mockFileStorageService.deleteFile).toHaveBeenCalledTimes(1);
      expect(mockLessonPlanRepository.delete).toHaveBeenCalledWith(
        lessonPlanId
      );
    });

    it("should only delete original file if PDF path is null, and vice-versa (testing original only)", async () => {
      const lessonPlanOriginalOnly: LessonPlan = {
        ...baseMockLessonPlan,
        id: lessonPlanId,
        originalFilePath: "path/to/original.file",
        originalFileName: "original.file",
        newPdfFilePath: null,
      };
      mockLessonPlanRepository.findById.mockResolvedValue(
        lessonPlanOriginalOnly
      );
      mockFileStorageService.deleteFile.mockResolvedValue(undefined);

      await lessonPlanService.deleteLessonById(lessonPlanId);

      expect(mockFileStorageService.deleteFile).toHaveBeenCalledTimes(1);
      expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith(
        lessonPlanOriginalOnly.originalFilePath
      );
      expect(mockLessonPlanRepository.delete).toHaveBeenCalledWith(
        lessonPlanId
      );
    });
  });
});
