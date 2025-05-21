import React from "react";
import { Alert, Button, Space, Typography } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { Paragraph } = Typography;

interface ErrorDisplayProps {
  message?: string;
  description?: string | React.ReactNode;
  onRetry?: () => void;
  retryLoading?: boolean;
  style?: React.CSSProperties;
}

export function ErrorDisplay({
  message = "Um erro ocorreu",
  description = "Um erro aconteceu. Tente novamente, por favor.",
  onRetry,
  retryLoading = false,
  style,
}: ErrorDisplayProps) {
  return (
    <Alert
      message={message}
      description={
        <Space direction="vertical">
          <Paragraph type="secondary">{description}</Paragraph>
          {onRetry && (
            <Button
              type="primary"
              onClick={onRetry}
              loading={retryLoading}
              icon={<ExclamationCircleOutlined />}
            >
              Tente denovo
            </Button>
          )}
        </Space>
      }
      type="error"
      showIcon
      style={{ margin: "20px 0", ...style }}
    />
  );
}
