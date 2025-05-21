"use client";
import React, { useState, useEffect } from "react";
import {
  Modal,
  Tabs,
  Button,
  Alert,
  Typography,
  Descriptions,
  message,
  Row,
  Col,
  Divider,
} from "antd";
import type { TabsProps } from "antd";
import { LessonPlanUpdatePayload, PdfLayoutType } from "@/lib/types";
import { FilePreviewer } from "../shared/FilePreviewer";
import { EditLessonPlanForm } from "./EditLessonPlanForm";
import {
  lessonPlanQueryKeys,
  useLessonPlanApi,
} from "@/hooks/useLessonPlanApi";
import { DownloadOutlined } from "@ant-design/icons";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { formatDate } from "../../lib/utils/formatDate";
import { useQueryClient } from "@tanstack/react-query";

const { Title, Paragraph, Text } = Typography;

interface LessonPlanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string | null;
}

export const LessonPlanDetailModal: React.FC<LessonPlanDetailModalProps> = ({
  isOpen,
  onClose,
  planId,
}) => {
  const [activeTabKey, setActiveTabKey] = useState("preview");

  const queryClient = useQueryClient();

  const api = useLessonPlanApi();

  const {
    data: currentPlan,
    isLoading: isLoadingPlan,
    isError: isErrorPlan,
    error: errorPlan,
    refetch: refetchPlanDetails,
  } = api.useGetLessonPlanById(planId, { enabled: isOpen && !!planId });

  const updatePlanMutation = api.useUpdateLessonPlan();
  // const regeneratePdfMutation = api.useRegeneratePdf();

  useEffect(() => {
    if (isOpen && planId) {
      if (activeTabKey !== "preview" && activeTabKey !== "edit") {
        setActiveTabKey("preview");
      }
    } else if (!isOpen) {
      setActiveTabKey("preview");
    }
  }, [isOpen, planId, activeTabKey]);

  const handleSaveChanges = async (
    idForm: string,
    values: LessonPlanUpdatePayload,
    layoutType?: PdfLayoutType
  ) => {
    if (!currentPlan || !currentPlan.id) {
      message.error("Não foi possível salvar: dados do plano ausentes.");
      return;
    }

    if (idForm !== currentPlan.id) {
      console.warn(
        `ID do formulário (${idForm}) não corresponde ao ID do plano atual (${currentPlan.id}). Usando o ID do plano atual.`
      );
    }
    updatePlanMutation.mutate(
      { id: currentPlan.id, payload: values, layoutType },
      {
        onSuccess: (updatedPlan) => {
          queryClient.setQueryData(
            lessonPlanQueryKeys.detail(updatedPlan.id),
            updatedPlan
          );
          setActiveTabKey("preview");
        },
      }
    );
  };

  // const handleRegeneratePdf = async () => {
  //   if (!currentPlan) return;
  //   regeneratePdfMutation.mutate(
  //     { id: currentPlan.id, layoutType: selectedPdfLayout },
  //     {
  //       onSuccess: (updatedPlan) => {
  //         queryClient.setQueryData(
  //           lessonPlanQueryKeys.detail(updatedPlan.id),
  //           updatedPlan
  //         );
  //       },
  //     }
  //   );
  // };

  const renderReadOnlyField = (_label: string, value?: string | null) => {
    if (!value || value.trim() === "") {
      return <Text type="secondary">Não informado</Text>;
    }
    return (
      <Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
        {value}
      </Paragraph>
    );
  };

  const tabItems: TabsProps["items"] = currentPlan
    ? [
        {
          key: "preview",
          label: "Visualização e Detalhes",
          children: (
            <div>
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Title level={5} style={{ marginBottom: 16 }}>
                    Preview do Arquivo Original
                  </Title>
                  <FilePreviewer
                    fileUrl={api.getOriginalFileViewUrl(currentPlan)}
                    fileName={currentPlan.originalFileName}
                  />
                  <Button
                    icon={<DownloadOutlined />}
                    href={api.getOriginalFileDownloadUrl(currentPlan.id)}
                    target="_blank"
                    style={{ marginTop: 10 }}
                  >
                    Baixar Original
                  </Button>
                </Col>
                {currentPlan.newPdfFilePath && (
                  <Col xs={24} lg={12}>
                    <Title level={5} style={{ marginBottom: 16 }}>
                      Preview do PDF Gerado
                    </Title>
                    <FilePreviewer
                      fileUrl={api.getGeneratedPdfViewUrl(currentPlan)}
                      fileType="pdf"
                      fileName={`Gerado_${currentPlan.originalFileName?.replace(
                        /\.[^/.]+$/,
                        ".pdf"
                      )}`}
                    />
                    <Button
                      icon={<DownloadOutlined />}
                      href={api.getGeneratedPdfDownloadUrl(currentPlan.id)}
                      target="_blank"
                      style={{ marginTop: 10 }}
                    >
                      Baixar PDF Gerado
                    </Button>
                  </Col>
                )}
              </Row>
              <Divider />
              <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
                Informações Extraídas
              </Title>
              <Descriptions
                bordered
                column={1}
                size="small"
                layout="horizontal"
              >
                <Descriptions.Item label="Título">
                  {renderReadOnlyField("", currentPlan.title)}
                </Descriptions.Item>
                <Descriptions.Item label="Objetivos">
                  {renderReadOnlyField("", currentPlan.objectives)}
                </Descriptions.Item>
                <Descriptions.Item label="Conteúdo">
                  {renderReadOnlyField("", currentPlan.content)}
                </Descriptions.Item>
                <Descriptions.Item label="Observações">
                  {renderReadOnlyField("", currentPlan.observations)}
                </Descriptions.Item>
              </Descriptions>
              {/* <Space
                direction="vertical"
                style={{
                  marginTop: 24,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                  <Button
                    icon={<SyncOutlined />}
                    onClick={handleRegeneratePdf}
                    loading={regeneratePdfMutation.isPending}
                  >
                    Regenerar PDF
                  </Button>
              </Space> */}
            </div>
          ),
        },
        {
          key: "edit",
          label: "Editar Campos",
          children: (
            <EditLessonPlanForm
              plan={currentPlan}
              onSave={handleSaveChanges}
              isSaving={updatePlanMutation.isPending}
              saveError={
                updatePlanMutation.error
                  ? updatePlanMutation.error.message
                  : null
              }
              onCancel={() => setActiveTabKey("preview")}
            />
          ),
        },
      ]
    : [];

  if (isLoadingPlan && !currentPlan && isOpen) {
    return (
      <Modal
        title="Carregando Plano..."
        open={isOpen}
        onCancel={onClose}
        footer={null}
        width={1000}
      >
        <div style={{ textAlign: "center", padding: 40 }}>
          <LoadingSpinner size="large" tip="Carregando detalhes do plano..." />
        </div>
      </Modal>
    );
  }

  if (isErrorPlan && !currentPlan && isOpen) {
    return (
      <Modal
        title="Erro ao Carregar Plano"
        open={isOpen}
        onCancel={onClose}
        footer={null}
        width={1000}
      >
        <Alert
          message="Não foi possível carregar os detalhes do plano."
          description={errorPlan?.message || "Tente novamente mais tarde."}
          type="error"
          showIcon
          action={
            <Button size="small" danger onClick={() => refetchPlanDetails()}>
              Tentar Novamente
            </Button>
          }
        />
      </Modal>
    );
  }

  return (
    <Modal
      title={
        currentPlan
          ? `${currentPlan.title || currentPlan.originalFileName}`
          : "Detalhes do Plano de Aula"
      }
      open={isOpen && !!currentPlan}
      onCancel={onClose}
      width={1000}
      footer={null}
    >
      {currentPlan?.createdAt && (
        <Text
          type="secondary"
          style={{ display: "block", marginBottom: 16, fontSize: "12px" }}
        >
          {`Criado em: ${formatDate(currentPlan.createdAt)}`}
          {currentPlan.updatedAt &&
          formatDate(currentPlan.createdAt) !==
            formatDate(currentPlan.updatedAt)
            ? ` | Atualizado em: ${formatDate(currentPlan.updatedAt)}`
            : ""}
        </Text>
      )}
      <Tabs
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        items={tabItems}
      />
    </Modal>
  );
};
