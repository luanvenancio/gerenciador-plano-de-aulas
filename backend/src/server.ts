import { app } from "./app";
import { geminiConfig } from "./config/gemini.config";

const PORT = process.env.PORT || 3001;

function checkCriticalConfigs() {
  let hasCriticalError = false;
  if (!geminiConfig.projectId) {
    console.error(
      "ERRO CRÍTICO: A variável de ambiente GOOGLE_PROJECT_ID não está configurada para o Gemini LLM."
    );
    hasCriticalError = true;
  }
  if (!geminiConfig.location) {
    console.error(
      "ERRO CRÍTICO: A variável de ambiente GOOGLE_LOCATION não está configurada para o Gemini LLM."
    );
    hasCriticalError = true;
  }
  if (!geminiConfig.apiKey) {
    console.error(
      "ERRO CRÍTICO: A variável de ambiente GEMINI_API_KEY não está configurada para o Gemini LLM."
    );
    hasCriticalError = true;
  }

  if (hasCriticalError) {
    console.error(
      "Por favor, defina as variáveis de ambiente necessárias no seu arquivo .env ou no ambiente do sistema."
    );
    console.error(
      "A aplicação não será iniciada devido a erros críticos de configuração."
    );
    process.exit(1);
  } else {
    console.log(
      `Configuração do Gemini LLM: ID do Projeto: ${geminiConfig.projectId}, Modelo: ${geminiConfig.modelId}, Localização: ${geminiConfig.location}`
    );
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log(
        "Configuração do Gemini LLM: GOOGLE_APPLICATION_CREDENTIALS está definida."
      );
    }
  }
}

checkCriticalConfigs();

app
  .listen(PORT, () => {
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
    console.log(`API disponível em: http://localhost:${PORT}/api/v1`);
    console.log(`Rota de Health Check: http://localhost:${PORT}/health`);
  })
  .on("error", (error: NodeJS.ErrnoException) => {
    if (error.syscall !== "listen") {
      throw error;
    }

    switch (error.code) {
      case "EACCES":
        console.error(
          `A porta ${PORT} requer privilégios elevados (permissão negada).`
        );
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.error(`A porta ${PORT} já está em uso por outro processo.`);
        process.exit(1);
        break;
      default:
        console.error("Erro desconhecido ao iniciar o servidor:", error);
        throw error;
    }
  });
