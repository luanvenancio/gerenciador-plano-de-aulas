import React from "react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

interface LoadingSpinnerProps {
  tip?: string;
  size?: "small" | "default" | "large";
  fullscreen?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  spinning?: boolean;
}

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

export function LoadingSpinner({
  tip = "Loading...",
  size = "default",
  fullscreen = false,
  style,
  children,
  spinning,
}: LoadingSpinnerProps) {
  if (fullscreen) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          zIndex: 9999,
          ...style,
        }}
      >
        <Spin spinning={spinning} indicator={antIcon} tip={tip} size={size}>
          {children}
        </Spin>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "20px", ...style }}>
      <Spin spinning={spinning} indicator={antIcon} size={size}>
        {children}
      </Spin>
    </div>
  );
}
