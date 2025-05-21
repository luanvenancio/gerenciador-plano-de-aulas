import { LessonPlan } from "@prisma/client";
import {
  TDocumentDefinitions,
  StyleDictionary,
  ContentText,
} from "pdfmake/interfaces";

const compactStyles: StyleDictionary = {
  header: {
    fontSize: 16,
    bold: true,
    margin: [0, 0, 0, 10],
    alignment: "center",
  },
  subheader: {
    fontSize: 11,
    bold: true,
    margin: [0, 8, 0, 2],
  },
  label: {
    bold: true,
  },
  paragraph: {
    margin: [0, 0, 0, 5],
    fontSize: 9,
    lineHeight: 1.2,
  },
  footer: {
    fontSize: 7,
    italics: true,
    alignment: "center",
    margin: [0, 10, 0, 0],
  },
};

// const renderCompactField = (label: string, value?: string | null) => {
//   if (!value || value.trim() === "") return [];
//   const fieldContent: ContentText[] = [
//     { text: `${label}: `, style: "label" },
//     { text: value },
//   ];
//   return [{ text: fieldContent, style: "paragraph" }];
// };

export function generateCompactLayout(plan: LessonPlan): TDocumentDefinitions {
  const documentTitle =
    plan.title ||
    plan.originalFileName?.replace(/\.[^/.]+$/, "") ||
    "Plano de Aula";

  const content: any[] = [{ text: documentTitle, style: "header" }];

  content.push({
    text: "Detalhes do Plano",
    style: "subheader",
    decoration: "underline",
    margin: [0, 5, 0, 5],
  });

  const detailsTableBody = [];
  if (plan.objectives)
    detailsTableBody.push([
      { text: "Objetivos:", style: "label" },
      { text: plan.objectives, style: "paragraph" },
    ]);
  if (plan.content)
    detailsTableBody.push([
      { text: "Conteúdo:", style: "label" },
      { text: plan.content, style: "paragraph" },
    ]);
  if (plan.methodology)
    detailsTableBody.push([
      { text: "Metodologia:", style: "label" },
      { text: plan.methodology, style: "paragraph" },
    ]);
  if (plan.activities)
    detailsTableBody.push([
      { text: "Atividades:", style: "label" },
      { text: plan.activities, style: "paragraph" },
    ]);
  if (plan.resources)
    detailsTableBody.push([
      { text: "Recursos:", style: "label" },
      { text: plan.resources, style: "paragraph" },
    ]);
  if (plan.evaluation)
    detailsTableBody.push([
      { text: "Avaliação:", style: "label" },
      { text: plan.evaluation, style: "paragraph" },
    ]);
  if (plan.observations)
    detailsTableBody.push([
      { text: "Observações:", style: "label" },
      { text: plan.observations, style: "paragraph" },
    ]);

  if (detailsTableBody.length > 0) {
    content.push({
      layout: {
        hLineWidth: function (i: number, node: any) {
          return i === 0 || i === node.table.body.length ? 0 : 0.5;
        },
        vLineWidth: function (i: number, node: any) {
          return 0;
        },
        hLineColor: function (i: number, node: any) {
          return "#cccccc";
        },
        paddingLeft: function (i: number, node: any) {
          return i === 0 ? 0 : 8;
        },
        paddingRight: function (i: number, node: any) {
          return i === node.table.widths.length - 1 ? 0 : 8;
        },
        paddingTop: function (i: number, node: any) {
          return 2;
        },
        paddingBottom: function (i: number, node: any) {
          return 2;
        },
      },
      table: {
        widths: ["auto", "*"],
        body: detailsTableBody,
      },
      margin: [0, 0, 0, 10],
    });
  }

  return {
    content: content,
    styles: compactStyles,
    defaultStyle: {
      fontSize: 9,
    },
    footer: function (currentPage, pageCount) {
      return {
        text: `Página ${currentPage.toString()} de ${pageCount}`,
        style: "footer",
      };
    },
    pageMargins: [30, 40, 30, 40],
  };
}
