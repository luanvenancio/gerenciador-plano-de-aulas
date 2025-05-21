"use client";

import React from "react";
import {
  Card,
  Typography,
  Tag,
  Tooltip,
  Dropdown,
  MenuProps,
  Button,
  Flex,
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  MoreOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
} from "@ant-design/icons";
import { LessonPlan } from "@/lib/types";
import { formatDate } from "@/lib/utils/formatDate";

const { Text } = Typography;

interface LessonPlanCardProps {
  plan: LessonPlan;
  onViewDetails: (plan: LessonPlan) => void;
  onDeleteRequest: (plan: LessonPlan) => void;
  getGeneratedPdfDownloadUrl: (planId: string) => string;
}

export default function LessonPlanCard({
  plan,
  onViewDetails,
  onDeleteRequest,
  getGeneratedPdfDownloadUrl,
}: LessonPlanCardProps) {
  const menuItems: MenuProps["items"] = [];

  menuItems.push({
    key: "view-details-menu",
    label: "Ver Detalhes",
    icon: <EyeOutlined />,
    onClick: (e) => {
      e.domEvent.stopPropagation();
      onViewDetails(plan);
    },
  });

  if (plan.newPdfFilePath) {
    menuItems.push({
      key: "download-generated-menu",
      label: "Download Plano Gerado",
      icon: <DownloadOutlined />,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        window.location.href = getGeneratedPdfDownloadUrl(plan.id);
      },
    });
  }

  menuItems.push({ type: "divider", key: "divider-1" });

  menuItems.push({
    key: "delete-plan-menu",
    label: "Deletar Plano",
    icon: <DeleteOutlined />,
    danger: true,
    onClick: (e) => {
      e.domEvent.stopPropagation();
      onDeleteRequest(plan);
    },
  });

  const cardTitle = plan.title || plan.originalFileName;

  const cardActions = [];
  cardActions.push(
    <Tooltip title="View Original File" key="action-view-original">
      <Button
        type="text"
        icon={<EyeOutlined />}
        href={plan.originalFilePath}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      />
    </Tooltip>
  );

  if (plan.newPdfFilePath) {
    cardActions.push(
      <Tooltip title="Download Generated PDF" key="action-download-generated">
        <Button
          type="text"
          icon={<DownloadOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = getGeneratedPdfDownloadUrl(plan.id);
          }}
        />
      </Tooltip>
    );
  } else {
    cardActions.push(
      <Tooltip title="Generated PDF Pending" key="action-pending-pdf">
        <FilePdfOutlined style={{ color: "#ccc", padding: "4px 15px" }} />
      </Tooltip>
    );
  }

  cardActions.push(
    <Dropdown
      menu={{ items: menuItems }}
      placement="topRight"
      trigger={["click"]}
      key="action-more"
    >
      <Button
        type="text"
        icon={<MoreOutlined />}
        onClick={(e) => e.stopPropagation()}
      />
    </Dropdown>
  );

  return (
    <Card
      hoverable
      cover={getCoverImage(plan.originalFileName)}
      style={{
        width: 280,
        margin: "8px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      onClick={() => onViewDetails(plan)}
      extra={
        <Dropdown
          menu={{ items: menuItems }}
          placement="topRight"
          trigger={["click"]}
          key="action-more"
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      }
      // actions={cardActions}
    >
      <Card.Meta
        // avatar={
        //   <Avatar
        //     size={48}
        //     shape="square"
        //     icon={<FileTypeIcon fileName={plan.originalFileName} size={32} />}
        //     style={{
        //       backgroundColor: "transparent",
        //       marginRight: 12,
        //       display: "flex",
        //       alignItems: "center",
        //       justifyContent: "center",
        //     }}
        //   />
        // }
        title={
          <>
            {plan.newPdfFilePath ? (
              <Tag color="green" icon={<FilePdfOutlined />}>
                Gerado
              </Tag>
            ) : (
              <Tag color="orange" icon={<FilePdfOutlined />}>
                Pendente
              </Tag>
            )}
            <Tooltip title={cardTitle}>
              <Text
                strong
                style={{
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: "0.25rem",
                  marginLeft: "0.35rem",
                }}
              >
                {cardTitle}
              </Text>
            </Tooltip>
          </>
        }
        description={
          <Text
            type="secondary"
            style={{ fontSize: "12px", marginLeft: "0.35rem" }}
          >
            Criado em {formatDate(plan.createdAt)}
          </Text>
        }
      />
    </Card>
  );
}

const getCoverImage = (fileName?: string | null): React.ReactNode => {
  const extension = fileName?.split(".").pop()?.toLowerCase();
  let icon;
  const iconStyle = { fontSize: "64px" };

  if (extension === "docx" || extension === "doc") {
    icon = <FileWordOutlined style={{ ...iconStyle, color: "#1890ff" }} />;
  } else if (extension === "pdf") {
    icon = <FilePdfOutlined style={{ ...iconStyle, color: "#ff4d4f" }} />;
  } else {
    icon = <FileTextOutlined style={{ ...iconStyle, color: "#bfbfbf" }} />;
  }

  return (
    <Flex
      justify="center"
      align="center"
      style={{
        height: 150,
        width: "auto",
        backgroundColor: "#f2f7f8",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyItems: "center",
        margin: "0.4rem 0.8rem 0",
      }}
    >
      {icon}
    </Flex>
  );
};
