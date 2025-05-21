import { IDocumentParserService } from "@core/interfaces/IDocumentParserService";
import { AppError } from "@shared/errors/AppError";
import { DocxParser } from "infra/parsing/docx-parse";
import { PdfParser } from "infra/parsing/pdf-parser";

export class DocumentParserService implements IDocumentParserService {
  constructor(private pdfParser: PdfParser, private docxParser: DocxParser) {}

  async parse(filePath: string, mimeType: string): Promise<string> {
    if (mimeType === "application/pdf") {
      return this.pdfParser.parse(filePath);
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      return this.docxParser.parse(filePath);
    } else {
      console.error(`Unsupported file type for parsing: ${mimeType}`);
      throw new AppError(`Unsupported file type for parsing: ${mimeType}`, 415);
    }
  }
}
