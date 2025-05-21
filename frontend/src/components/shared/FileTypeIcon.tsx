import React from "react";
import {
  FilePdfOutlined,
  FileWordOutlined,
  FileUnknownOutlined,
  FileImageOutlined,
} from "@ant-design/icons";

interface FileTypeIconProps {
  fileName?: string;
  fileType?: string;
  size?: number;
}

export function FileTypeIcon({
  fileName,
  fileType,
  size = 24,
}: FileTypeIconProps) {
  const getIcon = () => {
    const style = { fontSize: size, marginRight: 8 };
    if (fileType?.startsWith("image/"))
      return <FileImageOutlined style={{ ...style, color: "#52c41a" }} />;
    if (fileType === "application/pdf" || fileName?.endsWith(".pdf"))
      return <FilePdfOutlined style={{ ...style, color: "#ff4d4f" }} />;
    if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName?.endsWith(".docx")
    )
      return <FileWordOutlined style={{ ...style, color: "#1890ff" }} />;
    return <FileUnknownOutlined style={{ ...style, color: "#8c8c8c" }} />;
  };
  return getIcon();
}
