import { LessonPlan } from "@prisma/client";
import { TDocumentDefinitions, StyleDictionary } from "pdfmake/interfaces";

const defaultStyles: StyleDictionary = {
  header: {
    fontSize: 18,
    bold: true,
    margin: [0, 0, 0, 20],
    alignment: "center",
  },
  subheader: {
    fontSize: 14,
    bold: true,
    margin: [0, 15, 0, 5],
  },
  label: {
    bold: true,
    color: "#333333",
  },
  paragraph: {
    margin: [0, 0, 0, 10],
    lineHeight: 1.3,
  },
  listItem: {
    margin: [0, 0, 0, 3],
  },
  footer: {
    fontSize: 8,
    italics: true,
    alignment: "center",
    margin: [0, 20, 0, 0],
  },
};

const renderField = (label: string, value?: string | null) => {
  if (!value || value.trim() === "") return [];
  return [
    { text: label, style: "subheader" },
    { text: value, style: "paragraph" },
  ];
};

export function generateStandardLayout(plan: LessonPlan): TDocumentDefinitions {
  const documentTitle =
    plan.title ||
    plan.originalFileName?.replace(/\.[^/.]+$/, "") ||
    "Plano de Aula";

  const content: any[] = [{ text: documentTitle, style: "header" }];

  content.push(...renderField("Objetivos", plan.objectives));
  content.push(...renderField("Conteúdo Programático", plan.content));
  content.push(...renderField("Metodologia", plan.methodology));
  content.push(...renderField("Atividades Propostas", plan.activities));
  content.push(...renderField("Recursos Necessários", plan.resources));
  content.push(...renderField("Avaliação", plan.evaluation));
  content.push(...renderField("Observações", plan.observations));

  return {
    content: content,
    styles: defaultStyles,
    defaultStyle: {
      fontSize: 10,
    },
    footer: function (currentPage, pageCount) {
      return {
        text: `Página ${currentPage.toString()} de ${pageCount}`,
        style: "footer",
      };
    },
    pageMargins: [40, 60, 40, 60],
  };
}
