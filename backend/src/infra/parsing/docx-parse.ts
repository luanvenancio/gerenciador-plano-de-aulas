import mammoth from "mammoth";
import { AppError } from "../../shared/errors/AppError";

export class DocxParser {
  async parse(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      // const htmlResult = await mammoth.convertToHtml({ path: filePath });
      return result.value;
    } catch (error: any) {
      console.error(`Error parsing DOCX file ${filePath}:`, error);
      throw new AppError(
        `Failed to parse DOCX file: ${error.message || "Unknown error"}`,
        500
      );
    }
  }
}
