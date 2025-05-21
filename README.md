## Visão Geral da Solução

[Screen Recording 2025-05-21 110809.webm](https://github.com/user-attachments/assets/c18da990-1bdc-4f27-be3f-89b03538c6c7)


A plataforma permite que professores realizem o upload de planos de aula existentes (PDF ou DOCX), visualizem uma prévia, extraiam informações chave para um formulário e, finalmente, gerem um novo PDF padronizado com o layout de sua escolha.

**Fluxo Principal:**

1.  **Upload:** Envio do documento original (.pdf, .docx).
2.  **Preview:** Visualização do arquivo carregado.
3.  **Extração e Edição:** O sistema (com IA Gemini) tenta extrair dados para campos estruturados (objetivos, conteúdo, etc.). O professor revisa, edita e complementa no formulário.
4.  **Padronização:** Geração de um novo PDF com layout moderno (opções como "Padrão" e "Compacto" disponíveis).

**Resultado:** O professor mantém o arquivo original arquivado, os dados do plano salvos de forma estruturada no banco, e um novo PDF padronizado pronto para uso.

## Funcionalidades Implementadas

- Upload de arquivos `.pdf` e `.docx`.
- Pré-visualização de arquivos na interface.
- Extração de dados de documentos com suporte de IA (Google Gemini).
- Formulário editável para refinar e completar informações do plano de aula.
- Múltiplos layouts para geração de PDF (ex: Padrão, Compacto).
- Armazenamento persistente de dados e arquivos.
- Funcionalidades CRUD completas para gerenciamento dos planos (visualizar, editar, baixar, excluir).

## Configuração e Execução Local

**Pré-requisitos:** Node.js (v18+ recomendado), pnpm.

1.  **Clonar Repositório:**

    ```bash
    git clone https://github.com/luanvenancio/gerenciador-plano-de-aulas.git
    cd gerenciador-plano-de-aulas
    ```

2.  **Configurar Backend (`/backend`):**

    - Navegue até `cd backend`.
    - Copie e Cole o `.env` enviado no privado ou Copie `.env.example` para `.env` e preencha as variáveis, **especialmente as do Google Gemini** (`GOOGLE_PROJECT_ID`, `GOOGLE_LOCATION`, `GEMINI_API_KEY`).
      - _O backend não iniciará sem as chaves do Gemini configuradas._
    - Instale dependências: `pnpm install`.
    - Configure o Prisma e o banco de dados:
      ```bash
      npx prisma generate
      npx prisma migrate dev --name init
      ```
      ou
      ```bash
      pnpm dlx prisma generate
      pnpm dlx prisma migrate dev --name init
      ```
    - Inicie o servidor: `pnpm dev`.

3.  **Configurar Frontend (`/frontend`):**

    - Em um novo terminal, navegue até `cd frontend`.
    - Copie `.env.example` para `.env` e configure `NEXT_PUBLIC_API_BASE_URL` (ex: `http://localhost:3001/api/v1`).
    - Instale dependências: `pnpm install`.
    - Inicie a aplicação: `pnpm dev`.

4.  Acesse `http://localhost:3000`(padrão) no seu navegador.

**Solução de Problemas Comuns:**

- **Erros do Prisma Client** (ex: `Cannot find module '.prisma/client/default'`, `Module '"@prisma/client"' has no exported member 'LessonPlan'`):
  Execute `npx prisma generate` e `npx prisma migrate dev` na pasta `backend`.
- **Falha na Inicialização do GeminiLlmService:** Verifique as variáveis de ambiente do Gemini no `.env` do backend.
- **Problemas na Extração de Dados de Arquivos Grandes:** Se um arquivo de plano de aula for muito extenso, a extração de dados pela IA pode falhar ou ser incompleta. Isso ocorre devido aos limites de tokens de entrada (`inputTokens`) e/ou saída (`maxOutputTokens`) do modelo de linguagem.

## Decisões de Design e Suposições

- **Escopo do Documento:** Cada arquivo enviado representa um único plano de aula.
- **Variedade de Formato:** Os documentos de entrada podem variar em formatação, mas os campos conceituais a serem extraídos são consistentes (objetivos, contéudo, ...).
- **Abordagem para Extração de Dados:** Optou-se pelo uso de LLM como o Google Gemini para a extração de dados dos documentos. Uma abordagem inicial utilizando parsers com expressões regulares (regex) e um sistema de pontuação para identificar seções foi testada, porém os resultados não se mostraram precisos devido à grande variabilidade na formatação dos planos de aula de entrada.
- **Geração de PDF no Backend:** Centralizada para consistência, utilizando PDFMake.
- **Múltiplos Layouts de PDF:** Implementado para oferecer flexibilidade.
- **Preview de DOCX:** O foco do preview integrado é em PDFs; arquivos DOCX originais estão disponíveis para download. O PDF gerado a partir de um DOCX também é visualizável.
- **Estado do Frontend:** TanStack Query gerencia os dados do servidor, otimizando a experiência do usuário.
