import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import {
  LessonPlan,
  LessonPlanListResponse,
  LessonPlanResponse,
  LessonPlanUpdatePayload,
  PdfLayoutType,
} from "@/lib/types";

export const lessonPlanQueryKeys = {
  all: ["lessonPlans", "all"] as const,
  lists: () => [...lessonPlanQueryKeys.all, "list"] as const,
  details: () => [...lessonPlanQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...lessonPlanQueryKeys.details(), id] as const,
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const commonFetch = async <TResponse>(
  url: string,
  options?: RequestInit
): Promise<TResponse> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `HTTP error! Status: ${response.status} ${response.statusText}`,
    }));
    throw new Error(
      errorData.message || `Request failed: ${response.statusText}`
    );
  }
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined as TResponse;
  }
  return response.json() as Promise<TResponse>;
};

export const apiGetLessonPlans = async (): Promise<LessonPlan[]> => {
  const response = await commonFetch<LessonPlanListResponse | LessonPlan[]>(
    `${API_BASE_URL}/lesson-plans`
  );
  if (
    response &&
    "lessonPlans" in response &&
    Array.isArray(response.lessonPlans)
  ) {
    return response.lessonPlans;
  }
  if (Array.isArray(response)) {
    return response;
  }
  console.warn("apiGetLessonPlans: Unexpected response structure", response);
  return [];
};

export const apiGetLessonPlanById = async (id: string): Promise<LessonPlan> => {
  const response = await commonFetch<LessonPlanResponse | LessonPlan>(
    `${API_BASE_URL}/lesson-plans/${id}`
  );
  if (
    response &&
    "lessonPlan" in response &&
    typeof response.lessonPlan === "object" &&
    response.lessonPlan !== null
  ) {
    return response.lessonPlan;
  }
  if (response && typeof response === "object" && "id" in response) {
    return response as LessonPlan;
  }
  throw new Error(
    `Lesson plan with ID ${id} not found or unexpected response structure.`
  );
};

export const apiCreateLessonPlanStep1 = async (
  formData: FormData
): Promise<LessonPlan> => {
  const response = await commonFetch<LessonPlanResponse>(
    `${API_BASE_URL}/lesson-plans/`,
    {
      method: "POST",
      body: formData,
    }
  );
  if (!response || !response.lessonPlan) {
    throw new Error(
      "Failed to process initial file: No lesson plan data returned."
    );
  }
  return response.lessonPlan;
};

export const apiCreateLessonPlanStep2Finalize = async ({
  id,
  payload,
  layoutType,
}: {
  id: string;
  payload: LessonPlanUpdatePayload;
  layoutType?: PdfLayoutType;
}): Promise<LessonPlan> => {
  return commonFetch<LessonPlan>(
    `${API_BASE_URL}/lesson-plans/${id}/finalize`,
    {
      method: "PUT",
      body: JSON.stringify({ formData: payload, layoutType }),
    }
  );
};

export const apiUpdateLessonPlan = async ({
  id,
  payload,
  layoutType,
}: {
  id: string;
  payload: LessonPlanUpdatePayload;
  layoutType?: PdfLayoutType;
}): Promise<LessonPlan> => {
  return commonFetch<LessonPlan>(
    `${API_BASE_URL}/lesson-plans/${id}/finalize`,
    {
      method: "PUT",
      body: JSON.stringify({ formData: payload, layoutType }),
    }
  );
};

export const apiDeleteLessonPlan = async (id: string): Promise<void> => {
  await commonFetch<void>(`${API_BASE_URL}/lesson-plans/${id}`, {
    method: "DELETE",
  });
};

export const apiRegeneratePdf = async ({
  id,
  layoutType = PdfLayoutType.STANDARD,
}: {
  id: string;
  layoutType?: PdfLayoutType;
}): Promise<LessonPlan> => {
  return commonFetch<LessonPlan>(
    `${API_BASE_URL}/lesson-plans/${id}/regenerate-pdf`,
    {
      method: "POST",
      body: JSON.stringify({ layoutType }),
    }
  );
};

export const useLessonPlanApi = () => {
  const queryClient = useQueryClient();

  const useGetLessonPlans = () => {
    return useQuery<LessonPlan[], Error>({
      queryKey: lessonPlanQueryKeys.all,
      queryFn: apiGetLessonPlans,
    });
  };

  const useGetLessonPlanById = (
    id: string | null | undefined,
    options?: { enabled?: boolean }
  ) => {
    return useQuery<LessonPlan, Error>({
      queryKey: lessonPlanQueryKeys.detail(id!),
      queryFn: () => apiGetLessonPlanById(id!),
      enabled:
        !!id && (options?.enabled !== undefined ? options.enabled : true),
    });
  };

  const useCreateLessonPlanStep1 = () => {
    return useMutation<LessonPlan, Error, FormData>({
      mutationFn: apiCreateLessonPlanStep1,
      onSuccess: (data) => {
        message.success("Arquivo processado e dados iniciais extraídos!");
        queryClient.setQueryData(lessonPlanQueryKeys.detail(data.id), data);
      },
      onError: (error) => {
        console.error("Hook onError (Step1):", error);
        message.error(`Falha no Passo 1: ${error.message}`);
      },
    });
  };

  const useCreateLessonPlanStep2Finalize = () => {
    return useMutation<
      LessonPlan,
      Error,
      {
        id: string;
        payload: LessonPlanUpdatePayload;
        layoutType?: PdfLayoutType;
      }
    >({
      mutationFn: apiCreateLessonPlanStep2Finalize,
      onSuccess: (data) => {
        message.success("Plano de aula finalizado e PDF gerado!");
        queryClient.setQueryData(lessonPlanQueryKeys.detail(data.id), data);
        queryClient.invalidateQueries({ queryKey: lessonPlanQueryKeys.all });
      },
      onError: (error) => {
        message.error(`Falha ao finalizar: ${error.message}`);
      },
    });
  };

  const useUpdateLessonPlan = () => {
    return useMutation<
      LessonPlan,
      Error,
      {
        id: string;
        payload: LessonPlanUpdatePayload;
        layoutType?: PdfLayoutType;
      }
    >({
      mutationFn: apiUpdateLessonPlan,
      onSuccess: (data, variables) => {
        message.success("Plano de aula atualizado com sucesso!");
        queryClient.setQueryData(
          lessonPlanQueryKeys.detail(variables.id),
          data
        );
        queryClient.invalidateQueries({ queryKey: lessonPlanQueryKeys.all });
      },
      onError: (error) => {
        message.error(`Falha ao atualizar: ${error.message}`);
      },
    });
  };

  const useDeleteLessonPlan = () => {
    return useMutation<void, Error, string>({
      mutationFn: apiDeleteLessonPlan,
      onSuccess: (_, deletedId) => {
        message.success("Plano de aula excluído com sucesso!");
        queryClient.removeQueries({
          queryKey: lessonPlanQueryKeys.detail(deletedId),
        });
        queryClient.invalidateQueries({ queryKey: lessonPlanQueryKeys.all });
      },
      onError: (error) => {
        message.error(`Falha ao excluir: ${error.message}`);
      },
    });
  };

  const useRegeneratePdf = () => {
    return useMutation<
      LessonPlan,
      Error,
      { id: string; layoutType?: PdfLayoutType }
    >({
      mutationFn: apiRegeneratePdf,
      onSuccess: (data, regeneratedId) => {
        message.success("Nova geração de PDF solicitada!");
        queryClient.setQueryData(
          lessonPlanQueryKeys.detail(regeneratedId.id),
          data
        );

        queryClient.invalidateQueries({ queryKey: lessonPlanQueryKeys.all });
      },
      onError: (error) => {
        message.error(`Falha ao regenerar PDF: ${error.message}`);
      },
    });
  };

  const getGeneratedPdfDownloadUrl = (planId: string): string => {
    return `${API_BASE_URL}/lesson-plans/${planId}/download-pdf`;
  };

  const getOriginalFileDownloadUrl = (planId: string): string => {
    return `${API_BASE_URL}/lesson-plans/${planId}/download-original`;
  };

  const getOriginalFileViewUrl = (plan: LessonPlan): string | undefined => {
    if (!plan.originalFilePath) return undefined;
    if (plan.originalFilePath.startsWith("http")) return plan.originalFilePath;
    if (plan.originalFilePath.startsWith("/uploads"))
      return plan.originalFilePath;
    if (plan.originalFileName?.endsWith(".docx")) return undefined;
    return `${API_BASE_URL}/lesson-plans/${plan.id}/view-original`;
  };

  const getGeneratedPdfViewUrl = (plan: LessonPlan): string | undefined => {
    if (!plan.newPdfFilePath) return undefined;
    if (plan.newPdfFilePath.startsWith("http")) return plan.newPdfFilePath;
    if (plan.newPdfFilePath.startsWith("/uploads")) return plan.newPdfFilePath;
    return `${API_BASE_URL}/lesson-plans/${plan.id}/view-generated-pdf`;
  };

  return {
    useGetLessonPlans,
    useGetLessonPlanById,
    useCreateLessonPlanStep1,
    useCreateLessonPlanStep2Finalize,
    useUpdateLessonPlan,
    useDeleteLessonPlan,
    useRegeneratePdf,
    getGeneratedPdfDownloadUrl,
    getOriginalFileDownloadUrl,
    getOriginalFileViewUrl,
    getGeneratedPdfViewUrl,
  };
};
