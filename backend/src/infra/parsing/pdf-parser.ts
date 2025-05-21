import fs from "fs/promises";
import pdf from "pdf-parse";
import { AppError } from "../../shared/errors/AppError";

export class PdfParser {
  async parse(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error: any) {
      console.error(`Error parsing PDF file ${filePath}:`, error);
      throw new AppError(
        `Failed to parse PDF file: ${error.message || "Unknown error"}`,
        500
      );
    }
  }
}
