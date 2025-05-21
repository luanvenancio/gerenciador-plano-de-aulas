import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { IPdfGeneratorService } from "../../core/interfaces/IPdfGeneratorService";
import { LessonPlan } from "@prisma/client";
import { AppError } from "../../shared/errors/AppError";

const GENERATED_PDF_DIR_BASE = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "uploads",
  "generated_pdfs"
);

export class PdfLibGeneratorService implements IPdfGeneratorService {
  async generatePdf(
    data: LessonPlan
  ): Promise<{ filePath: string; fileName: string }> {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const margin = 50;
      const contentWidth = width - 2 * margin;
      let y = height - margin;
      const defaultFontSize = 10;
      const titleFontSize = 16;
      const sectionTitleFontSize = 12;
      const lineSpacingFactor = 1.4;
      const sectionSpacing = 15;

      const addNewPageIfNeeded = (
        currentY: number,
        textHeight: number,
        currentPage: PDFPage
      ): { page: PDFPage; y: number } => {
        if (currentY - textHeight < margin) {
          currentPage = pdfDoc.addPage();
          currentY = height - margin;
        }
        return { page: currentPage, y: currentY };
      };

      const drawTextAndWrap = (
        textToDraw: string | null | undefined,
        currentYPosition: number,
        textFont: PDFFont,
        textSize: number,
        currentPageObject: { page: PDFPage }
      ): number => {
        if (!textToDraw) return currentYPosition;

        let yPos = currentYPosition;
        const textLines = textToDraw.split("\n");

        for (const singleLine of textLines) {
          if (singleLine.trim() === "") {
            const pageCheckEmpty = addNewPageIfNeeded(
              yPos,
              textSize * lineSpacingFactor,
              currentPageObject.page
            );
            currentPageObject.page = pageCheckEmpty.page;
            yPos = pageCheckEmpty.y;
            yPos -= textSize * lineSpacingFactor;
            continue;
          }

          const words = singleLine.split(" ");
          let lineBuffer = "";

          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = lineBuffer + (lineBuffer ? " " : "") + word;
            const testWidth = textFont.widthOfTextAtSize(testLine, textSize);

            if (testWidth <= contentWidth) {
              lineBuffer = testLine;
            } else {
              if (lineBuffer.trim() !== "") {
                const pageCheckBuffer = addNewPageIfNeeded(
                  yPos,
                  textSize * lineSpacingFactor,
                  currentPageObject.page
                );
                currentPageObject.page = pageCheckBuffer.page;
                yPos = pageCheckBuffer.y;

                currentPageObject.page.drawText(lineBuffer, {
                  x: margin,
                  y: yPos - textSize,
                  font: textFont,
                  size: textSize,
                  color: rgb(0, 0, 0),
                });
                yPos -= textSize * lineSpacingFactor;
              }
              lineBuffer = word;
            }
          }

          if (lineBuffer.trim() !== "") {
            const pageCheckLast = addNewPageIfNeeded(
              yPos,
              textSize * lineSpacingFactor,
              currentPageObject.page
            );
            currentPageObject.page = pageCheckLast.page;
            yPos = pageCheckLast.y;

            currentPageObject.page.drawText(lineBuffer, {
              x: margin,
              y: yPos - textSize,
              font: textFont,
              size: textSize,
              color: rgb(0, 0, 0),
            });
            yPos -= textSize * lineSpacingFactor;
          }
        }
        return yPos;
      };

      const currentPageHolder = { page: page };

      const documentTitle = `Plano de Aula: ${data.title || "Sem Título"}`;
      y = drawTextAndWrap(
        documentTitle,
        y,
        boldFont,
        titleFontSize,
        currentPageHolder
      );
      y -= sectionSpacing * 1.5;

      const sections: { label: string; value: string | null | undefined }[] = [
        { label: "Objetivos", value: data.objectives },
        { label: "Conteúdo Programático", value: data.content },
        { label: "Metodologia", value: data.methodology },
        { label: "Atividades Propostas", value: data.activities },
        { label: "Recursos Didáticos", value: data.resources },
        { label: "Avaliação", value: data.evaluation },
        { label: "Observações", value: data.observations },
      ];

      for (const section of sections) {
        if (section.value && section.value.trim() !== "") {
          const pageCheckSpaceBeforeSection = addNewPageIfNeeded(
            y,
            sectionTitleFontSize * lineSpacingFactor,
            currentPageHolder.page
          );
          currentPageHolder.page = pageCheckSpaceBeforeSection.page;
          y = pageCheckSpaceBeforeSection.y;

          y = drawTextAndWrap(
            section.label,
            y,
            boldFont,
            sectionTitleFontSize,
            currentPageHolder
          );
          y = drawTextAndWrap(
            section.value,
            y,
            font,
            defaultFontSize,
            currentPageHolder
          );
          y -= sectionSpacing;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const safeTitle = (data.title || `lesson_plan_${data.id}`)
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      const fileName = `${safeTitle}_${Date.now()}.pdf`;
      const filePath = path.join(GENERATED_PDF_DIR_BASE, fileName);

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, pdfBytes);
      return { filePath, fileName };
    } catch (error) {
      console.error("Error generating PDF with PdfLibGeneratorService:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to generate PDF.", 500);
    }
  }
}
