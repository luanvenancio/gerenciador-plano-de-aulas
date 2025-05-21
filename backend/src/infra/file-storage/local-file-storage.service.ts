import fs from "fs/promises";
import path from "path";
import {
  IFileStorageService,
  UploadedFile,
} from "../../core/interfaces/IFileStorageService";
import { AppError } from "../../shared/errors/AppError";

const UPLOAD_DIR_BASE = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "uploads"
);

export class LocalFileStorageService implements IFileStorageService {
  constructor() {}

  private async ensureDirectoryExists(directory: string): Promise<void> {
    try {
      await fs.access(directory);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        await fs.mkdir(directory, { recursive: true });
      } else {
        console.error(`Error accessing directory ${directory}:`, error);
        throw new AppError(
          `Failed to ensure directory ${directory} exists due to permissions or other issues.`,
          500
        );
      }
    }
  }

  async saveFile(
    file: UploadedFile,
    destinationSubFolder: string
  ): Promise<{ filePath: string; fileName: string }> {
    const finalDestinationFolder = path.join(
      UPLOAD_DIR_BASE,
      destinationSubFolder
    );
    await this.ensureDirectoryExists(finalDestinationFolder);

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeOriginalName = file.originalname
      .replace(/[^a-zA-Z0-9_.-]/g, "_")
      .replace(/\s+/g, "_");
    const newFileName = uniqueSuffix + "-" + safeOriginalName;
    const newFilePath = path.join(finalDestinationFolder, newFileName);

    if (!file.path) {
      throw new AppError(
        "File processing error: uploaded file path not found.",
        500
      );
    }

    try {
      await fs.rename(file.path, newFilePath);
      return { filePath: newFilePath, fileName: newFileName };
    } catch (error) {
      console.error(
        `Error moving file from ${file.path} to ${newFilePath}:`,
        error
      );
      throw new AppError("Failed to save the uploaded file permanently.", 500);
    }
  }
  async deleteFile(filePath: string): Promise<void> {
    try {
      const resolvedFilePath = path.resolve(filePath);
      const resolvedUploadDirBase = path.resolve(UPLOAD_DIR_BASE);

      if (!resolvedFilePath.startsWith(resolvedUploadDirBase)) {
        console.error(
          `Attempt to delete file outside of designated upload directory: ${filePath}`
        );
        throw new AppError("Invalid file path for deletion.", 400);
      }

      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.warn(
          `Attempted to delete file that does not exist: ${filePath}`
        );
        return;
      }

      throw new AppError(
        `Could not delete file: ${error.message || "Unknown error"}.`,
        500
      );
    }
  }
}
