import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerativeModel as GoogleAiGenerativeModel,
  GenerateContentRequest,
} from "@google/generative-ai";
import {
  ILlmService,
  ExtractedLessonPlanData,
} from "../../core/interfaces/ILlmService";
import { geminiConfig } from "../../config/gemini.config";
import { AppError } from "../../shared/errors/AppError";

export class GeminiLlmService implements ILlmService {
  private generativeModel: GoogleAiGenerativeModel;

  constructor() {
    if (!geminiConfig.apiKey) {
      const errorMessage =
        "GEMINI_API_KEY must be configured. Please get one from Google AI Studio and set it in your .env file.";
      console.error("CRITICAL GEMINI CONFIG ERROR:", errorMessage);
      throw new AppError(errorMessage, 500);
    }
    if (!geminiConfig.modelId) {
      const errorMessage =
        "GEMINI_MODEL_ID must be configured. Please set it in your .env file (e.g., 'gemini-1.5-flash-latest').";
      console.error("CRITICAL GEMINI CONFIG ERROR:", errorMessage);
      throw new AppError(errorMessage, 500);
    }

    try {
      const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);
      this.generativeModel = genAI.getGenerativeModel({
        model: geminiConfig.modelId,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
        generationConfig: {
          // temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      });
    } catch (error: any) {
      const errorMessage =
        "Failed to initialize Google AI LLM client. Check API Key and configuration.";
      console.error("GOOGLE AI INIT ERROR:", error.message, error.stack);
      throw new AppError(errorMessage, 500);
    }
  }

  private buildPrompt(text: string): string {
    return `
      Você é um assistente especializado em analisar planos de aula.
      Extraia as seguintes informações do texto do plano de aula fornecido abaixo:
      1. "objectives": Objetivos de aprendizagem (string)
      2. "content": Conteúdo programático principal (string)
      3. "methodology": Metodologia de ensino (string)
      4. "activities": Atividades propostas (string)
      5. "resources": Recursos didáticos necessários (string)
      6. "evaluation": Critérios e métodos de avaliação (string)
      7. "observations": Observações adicionais ou outros campos relevantes (string)

      Retorne a informação ESTRITAMENTE em formato JSON válido, com as chaves mencionadas acima.
      Se alguma informação não estiver presente ou não puder ser claramente identificada, retorne null para a chave correspondente ou uma string vazia.
      Não inclua nenhuma explicação ou texto adicional fora do objeto JSON.
      O JSON deve estar completo, mesmo que os valores sejam nulos ou strings vazias.

      Texto do Plano de Aula:
      ---
      ${text}
      ---
      JSON:
    `;
  }

  async extractDataFromText(text: string): Promise<ExtractedLessonPlanData> {
    if (!text || text.trim() === "") {
      console.warn("LLM extraction skipped: input text is empty.");
      return {
        objectives: null,
        content: null,
        methodology: null,
        activities: null,
        resources: null,
        evaluation: null,
        observations: null,
      };
    }

    const prompt = this.buildPrompt(text);

    const request: GenerateContentRequest = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    try {
      const result = await this.generativeModel.generateContent(request);
      const response = result.response;

      if (!response) {
        console.error(
          "LLM did not return a response object. Full result:",
          JSON.stringify(result, null, 2)
        );
        throw new AppError("LLM did not return a response object.", 500);
      }

      if (response.promptFeedback?.blockReason) {
        const blockMessage = `LLM request was blocked. Reason: ${
          response.promptFeedback.blockReason
        }. ${response.promptFeedback.blockReasonMessage || ""}`;
        console.error(
          blockMessage,
          "Safety Ratings:",
          response.promptFeedback.safetyRatings
        );
        throw new AppError(blockMessage, 400);
      }

      if (!response.candidates || response.candidates.length === 0) {
        console.error(
          "LLM did not return any candidates. Response:",
          JSON.stringify(response, null, 2)
        );
        if (response.promptFeedback) {
          console.error("Prompt Feedback:", response.promptFeedback);
        }
        throw new AppError("LLM did not return any candidates.", 500);
      }

      const candidate = response.candidates[0];

      if (
        candidate.finishReason &&
        candidate.finishReason !== "STOP" &&
        candidate.finishReason !== "MAX_TOKENS"
      ) {
        console.warn(
          `LLM generation finished with reason: ${candidate.finishReason}`,
          "Safety Ratings:",
          candidate.safetyRatings
        );
        if (candidate.finishReason === "SAFETY") {
          throw new AppError(
            "LLM generation blocked due to safety settings on candidate.",
            400
          );
        }
      }

      if (
        !candidate.content ||
        !candidate.content.parts ||
        candidate.content.parts.length === 0 ||
        !candidate.content.parts[0].text
      ) {
        console.error(
          "LLM response content or text part is missing. Candidate:",
          JSON.stringify(candidate, null, 2)
        );
        throw new AppError(
          "LLM response content or text part is missing.",
          500
        );
      }

      let llmResponseText = candidate.content.parts[0].text.trim();
      const originalRawResponse = llmResponseText;

      const markdownMatch = llmResponseText.match(
        /```(?:json)?\s*([\s\S]*?)\s*```/i
      );
      if (markdownMatch && markdownMatch[1]) {
        llmResponseText = markdownMatch[1].trim();
      } else {
        const jsonPrefixRegex = /^```(?:json)?\s*/i;
        if (jsonPrefixRegex.test(llmResponseText)) {
          llmResponseText = llmResponseText.replace(jsonPrefixRegex, "").trim();
        }

        const firstBrace = llmResponseText.indexOf("{");
        const lastBrace = llmResponseText.lastIndexOf("}");

        if (firstBrace !== -1 && lastBrace > firstBrace) {
          llmResponseText = llmResponseText
            .substring(firstBrace, lastBrace + 1)
            .trim();
        }
      }

      llmResponseText = llmResponseText.trim();

      try {
        if (llmResponseText === "") {
          console.error(
            "LLM response became empty after cleaning. Original raw response:",
            originalRawResponse
          );
          throw new Error("LLM response is empty after cleaning.");
        }

        const jsonData = JSON.parse(llmResponseText);
        const expectedKeys = [
          "objectives",
          "content",
          "methodology",
          "activities",
          "resources",
          "evaluation",
          "observations",
        ];
        const extractedData: ExtractedLessonPlanData = {};
        for (const key of expectedKeys) {
          extractedData[key] =
            jsonData[key] !== undefined
              ? jsonData[key] === ""
                ? null
                : jsonData[key]
              : null;
        }
        return extractedData;
      } catch (parseError: any) {
        console.error(
          "Failed to parse LLM JSON response. Cleaned Text:",
          llmResponseText,
          "Original Raw Text from LLM:",
          originalRawResponse,
          "Parse Error:",
          parseError.message,
          parseError.stack
        );
        throw new AppError(
          `Failed to parse LLM JSON response. Raw output (first 500 chars): ${originalRawResponse.substring(
            0,
            500
          )}... Error: ${parseError.message}`,
          500
        );
      }
    } catch (error: any) {
      console.error(
        "Error calling/processing Google AI LLM:",
        error.message,
        error.stack
      );
      if (error instanceof AppError) throw error;

      let detailMessage = error.message;
      if (
        error.cause &&
        typeof error.cause === "object" &&
        "message" in error.cause
      ) {
        detailMessage += ` Caused by: ${error.cause.message}`;
      } else if (error.details) {
        detailMessage += ` Details: ${JSON.stringify(error.details)}`;
      }

      throw new AppError(
        `Failed to extract data using Google AI LLM: ${detailMessage}`,
        500
      );
    }
  }
}
