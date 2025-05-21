"use client";

import React from "react";
import { Row, Col, Empty, Typography } from "antd";
import LessonPlanCard from "./LessonPlanCard";
import { LessonPlan } from "@/lib/types";

const { Paragraph } = Typography;

interface LessonPlanGridProps {
  plans: LessonPlan[];
  onViewDetails: (plan: LessonPlan) => void;
  onDeleteRequest: (plan: LessonPlan) => void;
  getGeneratedPdfDownloadUrl: (planId: string) => string;
}

export default function LessonPlanGrid({
  plans,
  onViewDetails,
  onDeleteRequest,
  getGeneratedPdfDownloadUrl,
}: LessonPlanGridProps) {
  if (plans.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Empty
          description={
            <Paragraph style={{ color: "#8c8c8c" }}>
              Nenhum plano de Aula encontrado.
              <br />
              Comece adicionando um novo plano de aula.
            </Paragraph>
          }
        />
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]} style={{ padding: "0 8px" }}>
      {plans.map((plan) => (
        <Col
          key={plan.id}
          xs={24}
          sm={12}
          md={8}
          lg={6}
          xl={6}
          style={{ display: "flex" }}
        >
          <LessonPlanCard
            plan={plan}
            onViewDetails={onViewDetails}
            onDeleteRequest={onDeleteRequest}
            getGeneratedPdfDownloadUrl={getGeneratedPdfDownloadUrl}
          />
        </Col>
      ))}
    </Row>
  );
}
