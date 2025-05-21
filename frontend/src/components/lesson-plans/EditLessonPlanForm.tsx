"use client";
import React, { useEffect, useState } from "react";
import { Form, Input, Button, Alert, Row, Col, Select } from "antd";
import {
  LessonPlan,
  LessonPlanUpdatePayload,
  PdfLayoutType,
  pdfLayoutTypeOptions,
} from "@/lib/types";
import { LoadingSpinner } from "../shared/LoadingSpinner";

const { TextArea } = Input;

interface EditLessonPlanFormProps {
  plan: LessonPlan;
  onSave: (
    id: string,
    values: LessonPlanUpdatePayload,
    layoutType?: PdfLayoutType
  ) => void;
  isSaving: boolean;
  saveError?: string | null;
  onCancel: () => void;
}

export const EditLessonPlanForm: React.FC<EditLessonPlanFormProps> = ({
  plan,
  onSave,
  isSaving,
  saveError,
  onCancel,
}) => {
  const [form] = Form.useForm<LessonPlanUpdatePayload>();
  const [selectedLayout, setSelectedLayout] = useState<PdfLayoutType>(
    PdfLayoutType.STANDARD
  );

  useEffect(() => {
    if (plan) {
      form.setFieldsValue({
        title: plan.title || plan.originalFileName.replace(/\.[^/.]+$/, ""),
        objectives: plan.objectives,
        content: plan.content,
        methodology: plan.methodology,
        activities: plan.activities,
        resources: plan.resources,
        evaluation: plan.evaluation,
        observations: plan.observations,
      });
    }
  }, [plan, form]);

  const handleFinish = (values: LessonPlanUpdatePayload) => {
    onSave(plan.id, values, selectedLayout);
  };

  return (
    <LoadingSpinner spinning={isSaving} tip="Saving changes...">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          title: plan.title || "",
          objectives: plan.objectives || "",
          content: plan.content || "",
          methodology: plan.methodology || "",
          activities: plan.activities || "",
          resources: plan.resources || "",
          evaluation: plan.evaluation || "",
          observations: plan.observations || "",
        }}
      >
        {saveError && (
          <Alert
            message={saveError}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="title"
              label="Título"
              rules={[{ required: true, message: "Preencha o título" }]}
            >
              <Input placeholder="Plano de aula" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Selecione o layout do PDF">
              <Select
                value={selectedLayout}
                onChange={(value) => setSelectedLayout(value)}
                options={pdfLayoutTypeOptions}
                disabled={isSaving}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="objectives" label="Objetivos">
              <TextArea rows={4} placeholder="Objetivos" />
            </Form.Item>
            <Form.Item name="content" label="Contéudo Progmático">
              <TextArea rows={4} placeholder="Contéudo Progmático" />
            </Form.Item>
            <Form.Item name="methodology" label="Metodologia">
              <TextArea rows={4} placeholder="Teaching Metodologia..." />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="activities" label="Atividades">
              <TextArea rows={4} placeholder="Atividades" />
            </Form.Item>
            <Form.Item name="resources" label="Recursos">
              <TextArea rows={4} placeholder="Recursos Necessários" />
            </Form.Item>
            <Form.Item name="evaluation" label="Avaliação">
              <TextArea rows={4} placeholder="Métodos de avaliação" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="observations" label="Observções">
          <TextArea rows={3} placeholder="Observações adicionais" />
        </Form.Item>

        <Form.Item style={{ textAlign: "right", marginTop: 24 }}>
          <Button
            onClick={onCancel}
            style={{ marginRight: 8 }}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button type="primary" htmlType="submit" loading={isSaving}>
            Salvar Alterações
          </Button>
        </Form.Item>
      </Form>
    </LoadingSpinner>
  );
};
