import { LessonPlanController } from "../api/controllers/lesson-plan.controller";
import { UploadedFile } from "@core/interfaces/IFileStorageService";
import { PdfLayoutType } from "@core/interfaces/IPdfGeneratorService";
import { LessonPlan } from "@prisma/client";
import {
  LessonPlanService,
  LessonPlanProcessingResult,
  FinalizeLessonPlanInput,
} from "@services/lesson-plan.service";
import { AppError } from "@shared/errors/AppError";
import { Request, Response, NextFunction } from "express";
import * as fsPromises from "fs/promises";

jest.mock("../services/lesson-plan.service");
jest.mock("fs/promises", () => ({
  ...jest.requireActual("fs/promises"),
  access: jest.fn(),
}));

const MockedLessonPlanService = LessonPlanService as jest.MockedClass<
  typeof LessonPlanService
>;
const mockFsAccess = fsPromises.access as jest.Mock;

const mockRequest = (
  params: any = {},
  body: any = {},
  file?: Partial<UploadedFile>,
  query: any = {}
): Request => {
  const req = {
    params,
    body,
    query,
  } as Request;
  if (file) {
    req.file = file as Express.Multer.File;
  }
  return req;
};

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  res.download = jest.fn(
    (
      _path: string,
      _filename?: string | ((err?: any) => void),
      _options?: any | ((err?: any) => void),
      callback?: (err?: any) => void
    ) => {
      if (typeof _filename === "function") {
        _filename();
      } else if (typeof _options === "function") {
        _options();
      } else if (callback) {
        callback();
      }
      return res;
    }
  ) as jest.Mock;
  res.sendFile = jest.fn(
    (_path: string, _options?: any, callback?: (err?: any) => void) => {
      if (callback) callback();
      return res;
    }
  ) as jest.Mock;
  res.setHeader = jest.fn().mockReturnThis();
  res.headersSent = false;
  return res;
};

const mockNextFunction = jest.fn() as NextFunction;

const createMockUploadedFile = (
  originalname = "test.docx",
  mimetype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
): UploadedFile => ({
  fieldname: "file",
  originalname,
  encoding: "7bit",
  mimetype,
  buffer: Buffer.from("test content"),
  size: 12345,
  destination: "/tmp",
  filename: "randomname.docx",
  path: "/tmp/randomname.docx",
});

const baseMockLessonPlan: LessonPlan = {
  id: "plan-123",
  title: "Test Plan",
  originalFileName: "original.docx",
  originalFilePath: "path/to/original.docx",
  newPdfFilePath: "path/to/generated.pdf",
  objectives: "Test Objectives",
  content: "Test Content",
  methodology: "Test Methodology",
  activities: "Test Activities",
  resources: "Test Resources",
  evaluation: "Test Evaluation",
  observations: "Test Observations",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("LessonPlanController", () => {
  let lessonPlanController: LessonPlanController;
  let mockLessonPlanServiceInstance: jest.Mocked<LessonPlanService>;
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.clearAllMocks();
    MockedLessonPlanService.mockClear();
    mockLessonPlanServiceInstance = new MockedLessonPlanService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    ) as jest.Mocked<LessonPlanService>;
    lessonPlanController = new LessonPlanController(
      mockLessonPlanServiceInstance
    );
    res = mockResponse();
    next = mockNextFunction;
  });

  describe("uploadAndExtract", () => {
    it("should call service and return 201 with data on successful upload", async () => {
      const mockFile = createMockUploadedFile();
      const mockBody = { title: "My Uploaded Plan" };
      req = mockRequest({}, mockBody, mockFile);

      const serviceResult: LessonPlanProcessingResult = {
        lessonPlan: { ...baseMockLessonPlan, title: mockBody.title },
        extractedData: { objectives: "Extracted" } as any,
      };
      mockLessonPlanServiceInstance.processUploadedFileAndExtractData.mockResolvedValue(
        serviceResult
      );

      await lessonPlanController.uploadAndExtract(req, res, next);

      expect(
        mockLessonPlanServiceInstance.processUploadedFileAndExtractData
      ).toHaveBeenCalledWith({
        file: mockFile,
        title: mockBody.title,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(serviceResult);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with AppError if no file is uploaded", async () => {
      req = mockRequest({}, { title: "No File Plan" });

      await lessonPlanController.uploadAndExtract(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("File is required for upload.");
      expect(
        mockLessonPlanServiceInstance.processUploadedFileAndExtractData
      ).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws an error", async () => {
      const mockFile = createMockUploadedFile();
      req = mockRequest({}, { title: "Service Error Plan" }, mockFile);
      const serviceError = new Error("Service processing failed");
      mockLessonPlanServiceInstance.processUploadedFileAndExtractData.mockRejectedValue(
        serviceError
      );

      await lessonPlanController.uploadAndExtract(req, res, next);

      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("finalizeAndGenerate", () => {
    const planId = "finalize-plan-id";
    const mockFormData: FinalizeLessonPlanInput["formData"] = {
      title: "Finalized Plan",
    };
    const mockLayoutType = PdfLayoutType.COMPACT;

    it("should call service and return 200 with data on successful finalization", async () => {
      req = mockRequest(
        { id: planId },
        { formData: mockFormData, layoutType: mockLayoutType }
      );

      const finalizedPlan: LessonPlan = {
        ...baseMockLessonPlan,
        id: planId,
        title: "Finalized Plan",
        newPdfFilePath: "final.pdf",
      };
      mockLessonPlanServiceInstance.finalizeAndGeneratePdf.mockResolvedValue(
        finalizedPlan
      );

      await lessonPlanController.finalizeAndGenerate(req, res, next);

      expect(
        mockLessonPlanServiceInstance.finalizeAndGeneratePdf
      ).toHaveBeenCalledWith({
        lessonPlanId: planId,
        formData: mockFormData,
        layoutType: mockLayoutType,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(finalizedPlan);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with AppError if lessonPlanId is missing", async () => {
      req = mockRequest(
        {},
        { formData: mockFormData, layoutType: mockLayoutType }
      );

      await lessonPlanController.finalizeAndGenerate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain("Lesson plan ID is required");
    });

    it("should call next with error if service throws an error", async () => {
      req = mockRequest(
        { id: planId },
        { formData: mockFormData, layoutType: mockLayoutType }
      );
      const serviceError = new Error("Finalization failed");
      mockLessonPlanServiceInstance.finalizeAndGeneratePdf.mockRejectedValue(
        serviceError
      );

      await lessonPlanController.finalizeAndGenerate(req, res, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("getById", () => {
    const planId = "get-plan-id";

    it("should return 200 with lesson plan if found", async () => {
      req = mockRequest({ id: planId });
      const foundPlan: LessonPlan = { ...baseMockLessonPlan, id: planId };
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        foundPlan
      );

      await lessonPlanController.getById(req, res, next);

      expect(
        mockLessonPlanServiceInstance.getLessonPlanById
      ).toHaveBeenCalledWith(planId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(foundPlan);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with AppError(404) if lesson plan not found", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(null);

      await lessonPlanController.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Lesson plan not found.");
    });

    it("should call next with AppError(400) if ID is missing", async () => {
      req = mockRequest({});
      await lessonPlanController.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(400);
    });
  });

  describe("getAll", () => {
    it("should return 200 with all lesson plans", async () => {
      req = mockRequest();
      const plans: LessonPlan[] = [
        baseMockLessonPlan,
        { ...baseMockLessonPlan, id: "plan-456" },
      ];
      mockLessonPlanServiceInstance.getAllLessonPlan.mockResolvedValue(plans);

      await lessonPlanController.getAll(req, res, next);

      expect(mockLessonPlanServiceInstance.getAllLessonPlan).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(plans);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws an error", async () => {
      req = mockRequest();
      const serviceError = new Error("Failed to get all plans");
      mockLessonPlanServiceInstance.getAllLessonPlan.mockRejectedValue(
        serviceError
      );
      await lessonPlanController.getAll(req, res, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("downloadGeneratedPdf", () => {
    const planId = "pdf-download-id";
    const planTitleForTest = "Plano";
    const planWithPdf: LessonPlan = {
      ...baseMockLessonPlan,
      id: planId,
      newPdfFilePath: "/path/to/generated.pdf",
      title: planTitleForTest,
    };
    const planWithoutPdf: LessonPlan = {
      ...baseMockLessonPlan,
      id: planId,
      newPdfFilePath: null,
    };

    const planWithNullTitle: LessonPlan = {
      ...baseMockLessonPlan,
      id: planId,
      newPdfFilePath: "/path/to/generated.pdf",
      title: null,
    };

    it("should successfully initiate download if PDF exists and is accessible", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithPdf
      );
      mockFsAccess.mockResolvedValue(undefined);
      (res.download as jest.Mock).mockImplementation((_p, _f, _o, cb) => {
        let callbackToCall: ((err?: any) => void) | undefined;
        if (typeof _o === "function") {
          callbackToCall = _o;
        } else if (typeof cb === "function") {
          callbackToCall = cb;
        }
        if (callbackToCall) {
          callbackToCall();
        }
        return res;
      });
      res.headersSent = false;

      await lessonPlanController.downloadGeneratedPdf(req, res, next);

      expect(res.download).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
    it("should call res.download if PDF exists and is accessible with a specific title", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithPdf
      );
      mockFsAccess.mockResolvedValue(undefined);

      const expectedDownloadFileName = `${planTitleForTest
        .replace(/[^a-z0-9\s-]/gi, "_")
        .replace(/\s+/g, "_")
        .toLowerCase()}_padronizado.pdf`;

      await lessonPlanController.downloadGeneratedPdf(req, res, next);

      expect(
        mockLessonPlanServiceInstance.getLessonPlanById
      ).toHaveBeenCalledWith(planId);
      expect(mockFsAccess).toHaveBeenCalledWith(planWithPdf.newPdfFilePath);
      expect(res.download).toHaveBeenCalledWith(
        planWithPdf.newPdfFilePath,
        expectedDownloadFileName,
        expect.any(Function)
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should use default filename if plan title is null", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithNullTitle
      );
      mockFsAccess.mockResolvedValue(undefined);

      const expectedDefaultFileName = `plano_aula_${planId}_padronizado.pdf`;

      await lessonPlanController.downloadGeneratedPdf(req, res, next);

      expect(res.download).toHaveBeenCalledWith(
        planWithNullTitle.newPdfFilePath,
        expectedDefaultFileName,
        expect.any(Function)
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with AppError(404) if plan not found", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(null);
      await lessonPlanController.downloadGeneratedPdf(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Lesson plan not found.",
        })
      );
    });

    it("should call next with AppError(404) if PDF path is missing", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithoutPdf
      );
      await lessonPlanController.downloadGeneratedPdf(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Generated PDF path is missing for this lesson plan.",
        })
      );
    });

    it("should call next with AppError(500) if PDF file is not accessible", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithPdf
      );
      mockFsAccess.mockRejectedValue(new Error("File not found"));

      await lessonPlanController.downloadGeneratedPdf(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message:
            "Generated PDF file is missing or inaccessible on the server.",
        })
      );
    });

    it("should call next with error if res.download fails and headers not sent", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithPdf
      );
      mockFsAccess.mockResolvedValue(undefined);
      const downloadError = new Error("Download failed");
      (res.download as jest.Mock).mockImplementation((_p, _f, _o, cb) => {
        if (typeof _o === "function") _o(downloadError);
        else if (cb) cb(downloadError);
      });
      res.headersSent = false;

      await lessonPlanController.downloadGeneratedPdf(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: "Could not download the file due to a server error.",
        })
      );
    });

    it("should not call next if res.download fails but headers already sent", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithPdf
      );
      mockFsAccess.mockResolvedValue(undefined);
      const downloadError = new Error("Download failed");
      (res.download as jest.Mock).mockImplementation((_p, _f, _o, cb) => {
        if (typeof _o === "function") _o(downloadError);
        else if (cb) cb(downloadError);
      });
      res.headersSent = true;

      await lessonPlanController.downloadGeneratedPdf(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("deleteById", () => {
    const planId = "delete-id";
    it("should call service and return 204 on successful deletion", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.deleteLessonById.mockResolvedValue(
        undefined
      );

      await lessonPlanController.deleteById(req, res, next);

      expect(
        mockLessonPlanServiceInstance.deleteLessonById
      ).toHaveBeenCalledWith(planId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      req = mockRequest({ id: planId });
      const serviceError = new AppError("Plano não encontrado", 404);
      mockLessonPlanServiceInstance.deleteLessonById.mockRejectedValue(
        serviceError
      );

      await lessonPlanController.deleteById(req, res, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });
  describe("downloadOriginalFile", () => {
    const planId = "original-download-id";
    const planWithOriginalFile: LessonPlan = {
      ...baseMockLessonPlan,
      id: planId,
      originalFilePath: "path/to/original_document.docx",
      originalFileName: "original_document.docx",
      title: "Original Plan Title",
    };

    it("should call res.download with original file if it exists and is accessible", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithOriginalFile
      );
      mockFsAccess.mockResolvedValue(undefined);

      await lessonPlanController.downloadOriginalFile(req, res, next);

      expect(
        mockLessonPlanServiceInstance.getLessonPlanById
      ).toHaveBeenCalledWith(planId);
      expect(mockFsAccess).toHaveBeenCalledWith(
        planWithOriginalFile.originalFilePath
      );
      expect(res.download).toHaveBeenCalledWith(
        planWithOriginalFile.originalFilePath,
        planWithOriginalFile.originalFileName,
        expect.any(Function)
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with AppError(404) if plan not found", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(null);
      await lessonPlanController.downloadOriginalFile(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Lesson plan not found.",
        })
      );
    });

    it("should call next with AppError(404) if originalFilePath is an empty string", async () => {
      req = mockRequest({ id: planId });
      const planWithEmptyPath: LessonPlan = {
        ...baseMockLessonPlan,
        id: planId,
        originalFilePath: "",
        originalFileName: "somefile.docx",
      };
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithEmptyPath
      );
      await lessonPlanController.downloadOriginalFile(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Original file path is missing for this lesson plan.",
        })
      );
    });

    it("should call next with AppError(500) if original file is not accessible", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithOriginalFile
      );
      mockFsAccess.mockRejectedValue(new Error("Access denied"));

      await lessonPlanController.downloadOriginalFile(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: "Original file is missing or inaccessible on the server.",
        })
      );
    });

    it("should call next with error if res.download fails and headers not sent", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithOriginalFile
      );
      mockFsAccess.mockResolvedValue(undefined);
      const downloadError = new Error("Download failed");
      (res.download as jest.Mock).mockImplementation((_p, _f, _o, cb) => {
        if (typeof _o === "function") _o(downloadError);
        else if (cb) cb(downloadError);
      });
      res.headersSent = false;

      await lessonPlanController.downloadOriginalFile(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message:
            "Could not download the original file due to a server error.",
        })
      );
    });
  });

  describe("viewGeneratedPdf", () => {
    const planId = "pdf-view-id";
    const planWithPdf: LessonPlan = {
      ...baseMockLessonPlan,
      id: planId,
      newPdfFilePath: "/path/to/view_generated.pdf",
    };

    it("should call res.sendFile with PDF path if it exists and is accessible", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithPdf
      );
      mockFsAccess.mockResolvedValue(undefined);

      await lessonPlanController.viewGeneratedPdf(req, res, next);

      expect(
        mockLessonPlanServiceInstance.getLessonPlanById
      ).toHaveBeenCalledWith(planId);
      expect(mockFsAccess).toHaveBeenCalledWith(planWithPdf.newPdfFilePath);
      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/pdf"
      );
      expect(res.sendFile).toHaveBeenCalledWith(
        planWithPdf.newPdfFilePath,
        expect.any(Function)
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with AppError(404) if PDF path is missing", async () => {
      req = mockRequest({ id: planId });
      const planWithoutPdf: LessonPlan = {
        ...baseMockLessonPlan,
        id: planId,
        newPdfFilePath: null,
      };
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithoutPdf
      );

      await lessonPlanController.viewGeneratedPdf(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Generated PDF path is missing for this lesson plan.",
        })
      );
    });

    it("should call next with AppError(500) if PDF file is not accessible", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithPdf
      );
      mockFsAccess.mockRejectedValue(new Error("Cannot access file"));

      await lessonPlanController.viewGeneratedPdf(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message:
            "Generated PDF file is missing or inaccessible on the server.",
        })
      );
    });

    it("should call next with error if res.sendFile fails and headers not sent", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithPdf
      );
      mockFsAccess.mockResolvedValue(undefined);
      const sendFileError = new Error("SendFile failed");
      (res.sendFile as jest.Mock).mockImplementation((_p, _o, cb) => {
        if (typeof _o === "function") _o(sendFileError);
        else if (cb) cb(sendFileError);
      });
      res.headersSent = false;

      await lessonPlanController.viewGeneratedPdf(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: "Could not send the file for viewing due to a server error.",
        })
      );
    });
  });

  describe("viewOriginalFile", () => {
    const planId = "original-view-id";
    const planWithPdfOriginal: LessonPlan = {
      ...baseMockLessonPlan,
      id: planId,
      originalFilePath: "path/original.pdf",
      originalFileName: "original.pdf",
    };
    const planWithDocxOriginal: LessonPlan = {
      ...baseMockLessonPlan,
      id: planId,
      originalFilePath: "path/original.docx",
      originalFileName: "original.docx",
    };
    const planWithJpgOriginal: LessonPlan = {
      ...baseMockLessonPlan,
      id: planId,
      originalFilePath: "path/original.jpg",
      originalFileName: "original.jpg",
    };

    it("should send PDF with correct Content-Type if original is PDF", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithPdfOriginal
      );
      mockFsAccess.mockResolvedValue(undefined);

      await lessonPlanController.viewOriginalFile(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/pdf"
      );
      expect(res.sendFile).toHaveBeenCalledWith(
        planWithPdfOriginal.originalFilePath,
        expect.any(Function)
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should send JPG with correct Content-Type if original is JPG", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithJpgOriginal
      );
      mockFsAccess.mockResolvedValue(undefined);

      await lessonPlanController.viewOriginalFile(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/jpeg");
      expect(res.sendFile).toHaveBeenCalledWith(
        planWithJpgOriginal.originalFilePath,
        expect.any(Function)
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should call downloadOriginalFile if original is DOCX", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithDocxOriginal
      );
      mockFsAccess.mockResolvedValue(undefined);

      const downloadOriginalFileSpy = jest.spyOn(
        lessonPlanController,
        "downloadOriginalFile"
      );
      downloadOriginalFileSpy.mockResolvedValue(undefined);

      await lessonPlanController.viewOriginalFile(req, res, next);

      expect(downloadOriginalFileSpy).toHaveBeenCalledWith(req, res, next);
      expect(res.sendFile).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      downloadOriginalFileSpy.mockRestore();
    });

    it("should call next with AppError(404) if originalFilePath or originalFileName are empty strings", async () => {
      req = mockRequest({ id: planId });
      const planWithEmptyDetails: LessonPlan = {
        ...baseMockLessonPlan,
        id: planId,
        originalFilePath: "",
        originalFileName: "test.pdf",
      };
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithEmptyDetails
      );
      await lessonPlanController.viewOriginalFile(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message:
            "Original file path or name is missing for this lesson plan.",
        })
      );

      const planWithEmptyName: LessonPlan = {
        ...baseMockLessonPlan,
        id: planId,
        originalFilePath: "path/to/file.pdf",
        originalFileName: "",
      };
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithEmptyName
      );
      (next as jest.Mock).mockClear();
      await lessonPlanController.viewOriginalFile(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message:
            "Original file path or name is missing for this lesson plan.",
        })
      );
    });

    it("should call next with AppError(500) if original file is not accessible", async () => {
      req = mockRequest({ id: planId });
      mockLessonPlanServiceInstance.getLessonPlanById.mockResolvedValue(
        planWithPdfOriginal
      );
      mockFsAccess.mockRejectedValue(new Error("Access denied"));

      await lessonPlanController.viewOriginalFile(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: "Original file is missing or inaccessible on the server.",
        })
      );
    });
  });
});
