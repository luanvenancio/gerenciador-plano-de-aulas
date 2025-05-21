"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Upload,
  message,
  Space,
  Row,
  Col,
  Typography,
  Steps,
  Alert,
  Select,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import type { LessonPlan, LessonPlanUpdatePayload } from "@/lib/types";
import { PdfLayoutType, pdfLayoutTypeOptions } from "@/lib/types";
import { useLessonPlanApi } from "@/hooks/useLessonPlanApi";
// import FilePreview from "../shared/FilePreview";
import { LoadingSpinner } from "../shared/LoadingSpinner";

const { Dragger } = Upload;
const { TextArea } = Input;
const { Title, Paragraph } = Typography;
const { Step } = Steps;

interface CreateLessonPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (finalPlan: LessonPlan) => void;
}

export default function CreateLessonPlanModalC({
  visible,
  onClose,
  onSuccess,
}: CreateLessonPlanModalProps) {
  const [form] = Form.useForm<
    LessonPlanUpdatePayload & { titleStep1?: string }
  >();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLayout, setSelectedLayout] = useState<PdfLayoutType>(
    PdfLayoutType.STANDARD
  );
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedFileForPreview, setSelectedFileForPreview] =
    useState<File | null>(null);
  const [processedPlanFromStep1, setProcessedPlanFromStep1] =
    useState<LessonPlan | null>(null);
  const [hasBeenOpened, setHasBeenOpened] = useState(false);

  const api = useLessonPlanApi();
  const createStep1Mutation = api.useCreateLessonPlanStep1();
  const createStep2Mutation = api.useCreateLessonPlanStep2Finalize();

  const resetModalState = useCallback(
    (forceReset = false) => {
      if (forceReset || currentStep !== 0 || processedPlanFromStep1 !== null) {
        form.resetFields();
        setCurrentStep(0);
        setFileList([]);
        setSelectedFileForPreview(null);
        setProcessedPlanFromStep1(null);
        setSelectedLayout(PdfLayoutType.STANDARD);
      }
    },
    [form, currentStep, processedPlanFromStep1]
  );

  useEffect(() => {
    if (visible) {
      if (!hasBeenOpened) {
        resetModalState(true);
        setHasBeenOpened(true);
      }
    } else {
      if (hasBeenOpened) {
        resetModalState(true);
      }
      setHasBeenOpened(false);
    }
  }, [visible, resetModalState, hasBeenOpened]);

  useEffect(() => {
    if (processedPlanFromStep1 && currentStep === 1 && visible) {
      const initialFormValues: Partial<LessonPlanUpdatePayload> = {
        title:
          processedPlanFromStep1.title ||
          processedPlanFromStep1.originalFileName?.replace(/\.[^/.]+$/, "") ||
          "Plano de Aula",
        objectives: processedPlanFromStep1.objectives,
        content: processedPlanFromStep1.content,
        methodology: processedPlanFromStep1.methodology,
        activities: processedPlanFromStep1.activities,
        resources: processedPlanFromStep1.resources,
        evaluation: processedPlanFromStep1.evaluation,
        observations: processedPlanFromStep1.observations,
      };
      form.setFieldsValue(initialFormValues);
    }
  }, [processedPlanFromStep1, currentStep, form, visible]);

  const handleCloseModal = () => {
    onClose();
  };

  const handleUploadChange: UploadProps["onChange"] = (info) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.slice(-1);
    setFileList(newFileList);

    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const file = newFileList[0].originFileObj;
      setSelectedFileForPreview(file);
      form.setFieldsValue({ titleStep1: file.name.replace(/\.[^/.]+$/, "") });
    } else {
      setSelectedFileForPreview(null);
    }
  };

  const handleProcessInitialFile = async (valuesStep1: {
    titleStep1?: string;
  }) => {
    if (!selectedFileForPreview) {
      message.error("Por favor, selecione um arquivo original.");
      return;
    }
    const formData = new FormData();
    formData.append("lessonPlanFile", selectedFileForPreview);
    if (valuesStep1.titleStep1) {
      formData.append("title", valuesStep1.titleStep1);
    }

    createStep1Mutation.mutate(formData, {
      onSuccess: (initialPlanData) => {
        if (initialPlanData && initialPlanData.id) {
          setProcessedPlanFromStep1(initialPlanData);
          setCurrentStep(1);
        } else {
          message.error("Resposta da API para o Passo 1 foi inválida.");
        }
      },
    });
  };

  const handleFinalizePlan = async (
    valuesFormStep2: LessonPlanUpdatePayload
  ) => {
    if (!processedPlanFromStep1 || !processedPlanFromStep1.id) {
      message.error(
        "Erro: Plano processado não encontrado. Por favor, tente novamente."
      );
      setCurrentStep(0);
      setProcessedPlanFromStep1(null);
      return;
    }

    createStep2Mutation.mutate(
      {
        id: processedPlanFromStep1.id,
        payload: valuesFormStep2,
        layoutType: selectedLayout,
      },
      {
        onSuccess: (finalPlanData) => {
          onSuccess(finalPlanData);
          handleCloseModal();
        },
      }
    );
  };

  const handleVoltarParaPasso1 = () => {
    setCurrentStep(0);
    setProcessedPlanFromStep1(null);
    setSelectedLayout(PdfLayoutType.STANDARD);
    form.resetFields([
      "title",
      "objectives",
      "content",
      "methodology",
      "activities",
      "resources",
      "evaluation",
      "observations",
    ]);
  };

  const uploadProps: UploadProps = {
    onRemove: () => {
      setFileList([]);
      setSelectedFileForPreview(null);
      form.setFieldsValue({ titleStep1: "" });
    },
    beforeUpload: () => false,
    fileList,
    onChange: handleUploadChange,
    maxCount: 1,
    accept: ".pdf,.docx,.doc",
  };

  const isStep1Loading = createStep1Mutation.isPending;
  const isStep2Loading = createStep2Mutation.isPending;
  const step1Error = createStep1Mutation.error;
  const step2Error = createStep2Mutation.error;

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleProcessInitialFile}
          initialValues={{ titleStep1: "" }}
        >
          <Row justify="center">
            <Col xs={24} md={16} lg={14}>
              <Title level={4}>Passo 1: Enviar Documento</Title>
              <Paragraph>
                Envie seu plano de aula antigo. A plataforma irá processá-lo
                para extrair informações chave.
              </Paragraph>
              <Paragraph>
                Você poderá revisar e adicionar mais detalhes no próximo passo.
              </Paragraph>
              <Title level={5} style={{ marginTop: 20, marginBottom: 16 }}>
                Envio do arquivo
              </Title>
              <Dragger {...uploadProps} height={180} disabled={isStep1Loading}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Clique ou arraste o arquivo (.pdf, .docx) para esta área
                </p>
                <p className="ant-upload-hint">
                  O sistema tentará extrair os dados.
                </p>
              </Dragger>
              <Form.Item
                name="titleStep1"
                label="Título Inicial (Opcional)"
                style={{ marginTop: 16 }}
              >
                <Input
                  placeholder="Ex: Plano de História Antiga"
                  disabled={isStep1Loading}
                />
              </Form.Item>
              {/* {selectedFileForPreview && (
                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  <Title level={5}>Pré-visualização do Arquivo</Title>
                  <FilePreview file={selectedFileForPreview} />
                </div>
              )} */}
              {step1Error && (
                <Alert
                  message="Erro no Passo 1"
                  description={step1Error.message}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              <Form.Item style={{ textAlign: "right", marginTop: 24 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isStep1Loading}
                  disabled={!selectedFileForPreview || isStep1Loading}
                >
                  Extrair Dados
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      );
    } else if (currentStep === 1 && processedPlanFromStep1) {
      return (
        <Form<LessonPlanUpdatePayload>
          form={form}
          layout="vertical"
          onFinish={handleFinalizePlan}
        >
          <Title level={4} style={{ marginBottom: 16 }}>
            Passo 2: Revise e Complete as Informações
          </Title>
          <Paragraph>
            O sistema processou: {processedPlanFromStep1.originalFileName}.
            Revise os campos, edite conforme necessário e preencha quaisquer
            detalhes pendentes.
          </Paragraph>
          {step2Error && (
            <Alert
              message="Erro no Passo 2"
              description={step2Error.message}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Form.Item
            name="title"
            label="Título do Plano de Aula"
            rules={[{ required: true, message: "O título é obrigatório!" }]}
          >
            <Input
              placeholder="Ex: Ecossistemas Brasileiros"
              disabled={isStep2Loading}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="objectives" label="Objetivos">
                <TextArea
                  rows={4}
                  placeholder="Objetivos de aprendizagem..."
                  disabled={isStep2Loading}
                />
              </Form.Item>
              <Form.Item name="content" label="Conteúdo">
                <TextArea
                  rows={4}
                  placeholder="Conteúdo programático..."
                  disabled={isStep2Loading}
                />
              </Form.Item>
              <Form.Item name="methodology" label="Metodologia">
                <TextArea
                  rows={4}
                  placeholder="Metodologia de ensino..."
                  disabled={isStep2Loading}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="activities" label="Atividades">
                <TextArea
                  rows={4}
                  placeholder="Atividades propostas..."
                  disabled={isStep2Loading}
                />
              </Form.Item>
              <Form.Item name="resources" label="Recursos">
                <TextArea
                  rows={4}
                  placeholder="Recursos necessários..."
                  disabled={isStep2Loading}
                />
              </Form.Item>
              <Form.Item name="evaluation" label="Avaliação">
                <TextArea
                  rows={4}
                  placeholder="Métodos de avaliação..."
                  disabled={isStep2Loading}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="observations" label="Observações">
            <TextArea
              rows={3}
              placeholder="Notas adicionais..."
              disabled={isStep2Loading}
            />
          </Form.Item>
          <Form.Item label="Layout do PDF Gerado" style={{ marginTop: 16 }}>
            <Select
              value={selectedLayout}
              style={{ width: "100%" }}
              onChange={(value) => setSelectedLayout(value)}
              options={pdfLayoutTypeOptions}
              disabled={isStep2Loading}
            />
          </Form.Item>
          <Form.Item
            style={{
              textAlign: "right",
              marginTop: 24,
              borderTop: "1px solid #f0f0f0",
              paddingTop: 24,
            }}
          >
            <Space>
              <Button
                onClick={handleVoltarParaPasso1}
                disabled={isStep2Loading}
              >
                Voltar (Selecionar Arquivo)
              </Button>
              <Button type="primary" htmlType="submit" loading={isStep2Loading}>
                Finalizar e Gerar PDF
              </Button>
            </Space>
          </Form.Item>
        </Form>
      );
    }
    return null;
  };

  const isLoadingOverall =
    createStep1Mutation.isPending || createStep2Mutation.isPending;

  return (
    <Modal
      title="Criar Novo Plano de Aula"
      open={visible}
      onCancel={handleCloseModal}
      footer={null}
      width={currentStep === 0 ? 1000 : 800}
      maskClosable={!isLoadingOverall}
      key={visible ? "modal-open" : "modal-closed"}
    >
      <Steps
        current={currentStep}
        labelPlacement="vertical"
        style={{ marginBottom: 24, marginTop: 16 }}
      >
        <Step title="Upload" description="Envie seu arquivo" />
        <Step title="Revisão" description="Edite os dados extraídos." />
        <Step title="Finalizar" description="O PDF será gerado." />
      </Steps>
      <LoadingSpinner
        spinning={isLoadingOverall}
        tip={
          currentStep === 0 ? "Processando arquivo..." : "Finalizando plano..."
        }
      >
        {renderStepContent()}
      </LoadingSpinner>
    </Modal>
  );
}
