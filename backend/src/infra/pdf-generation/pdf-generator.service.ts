import { LessonPlan } from "@prisma/client";
import {
  IPdfGeneratorService,
  PdfLayoutType,
} from "../../core/interfaces/IPdfGeneratorService";

import fs from "fs";
import path from "path";
import Pdfmake from "pdfmake";
import { generateCompactLayout } from "./layout/compact";
import { generateStandardLayout } from "./layout/standard";
import { TDocumentDefinitions } from "pdfmake/interfaces";

const fonts = {
  Roboto: {
    normal: path.join(
      __dirname,
      "..",
      "..",
      "assets",
      "fonts",
      "Roboto-Regular.ttf"
    ),
    bold: path.join(
      __dirname,
      "..",
      "..",
      "assets",
      "fonts",
      "Roboto-Medium.ttf"
    ),
    italics: path.join(
      __dirname,
      "..",
      "..",
      "assets",
      "fonts",
      "Roboto-Italic.ttf"
    ),
    bolditalics: path.join(
      __dirname,
      "..",
      "..",
      "assets",
      "fonts",
      "Roboto-MediumItalic.ttf"
    ),
  },
};

export class MyPdfGeneratorService implements IPdfGeneratorService {
  private readonly outputDirectory: string;
  private readonly printer: Pdfmake;

  constructor(outputDir?: string) {
    this.outputDirectory =
      outputDir || path.join(process.cwd(), "generated_pdfs");
    if (!fs.existsSync(this.outputDirectory)) {
      fs.mkdirSync(this.outputDirectory, { recursive: true });
    }
    this.printer = new Pdfmake(fonts);
  }

  private sanitizeFileName(title: string): string {
    return title
      .replace(/[^a-z0-9\s-]/gi, "_")
      .replace(/\s+/g, "_")
      .toLowerCase();
  }

  async generatePdf(
    lessonPlan: LessonPlan,
    layoutType: PdfLayoutType = PdfLayoutType.STANDARD
  ): Promise<{ filePath: string; fileName: string }> {
    let pdfDocDefinition: TDocumentDefinitions;
    let baseFileName = this.sanitizeFileName(
      lessonPlan.title || lessonPlan.originalFileName || "plano_aula"
    );

    switch (layoutType) {
      case PdfLayoutType.COMPACT:
        pdfDocDefinition = generateCompactLayout(lessonPlan);
        baseFileName += "_compacto";
        break;
      case PdfLayoutType.STANDARD:
      default:
        pdfDocDefinition = generateStandardLayout(lessonPlan);
        baseFileName += "_padrao";
        break;
    }

    const timestamp = new Date().getTime();
    const finalFileName = `${baseFileName}_${timestamp}.pdf`;
    const filePath = path.join(this.outputDirectory, finalFileName);

    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = this.printer.createPdfKitDocument(pdfDocDefinition);
        const writeStream = fs.createWriteStream(filePath);
        pdfDoc.pipe(writeStream);
        pdfDoc.end();

        writeStream.on("finish", () => {
          resolve({ filePath, fileName: finalFileName });
        });

        writeStream.on("error", (err) => {
          console.error("Erro ao escrever o PDF no stream:", err);
          reject(new Error("Falha ao gerar o arquivo PDF."));
        });

        pdfDoc.on("error", (err) => {
          console.error("Erro no documento PDFKit:", err);
          reject(new Error("Falha ao processar o documento PDF."));
        });
      } catch (error) {
        console.error("Erro durante a inicialização da geração do PDF:", error);
        reject(new Error("Erro inesperado ao gerar PDF."));
      }
    });
  }
}
