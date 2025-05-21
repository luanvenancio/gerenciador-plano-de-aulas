"use client";
import React from "react";
import { Alert } from "antd";
import Image from "next/image";

interface FilePreviewerProps {
  fileUrl: string | null | undefined;
  fileType?: "pdf" | "docx" | "image" | "unknown";
  fileName?: string;
}

export const FilePreviewer: React.FC<FilePreviewerProps> = ({
  fileUrl,
  fileType,
  fileName,
}) => {
  if (!fileUrl) {
    return (
      <Alert
        message="Arquivo não disponível para visualização. Em vez disso, faça o download agora mesmo."
        type="info"
        showIcon
      />
    );
  }

  let effectiveFileType = fileType;
  if (!effectiveFileType && fileName) {
    if (fileName.endsWith(".pdf")) effectiveFileType = "pdf";
    else if (fileName.endsWith(".docx")) effectiveFileType = "docx";
    else if (fileName.match(/\.(jpeg|jpg|gif|png)$/i))
      effectiveFileType = "image";
  }

  if (effectiveFileType === "pdf") {
    return (
      <iframe
        src={fileUrl}
        style={{ width: "100%", height: "600px", border: "1px solid #d9d9d9" }}
        title={fileName || "File Preview"}
      />
    );
  }

  if (effectiveFileType === "image") {
    return (
      <Image
        src={fileUrl}
        fill
        alt={fileName || "File Preview"}
        style={{
          margin: "0 auto",
          maxHeight: "600px",
          border: "1px solid #d9d9d9",
        }}
      />
    );
  }

  if (effectiveFileType === "docx") {
    return (
      <Alert
        message="DOCX Preview"
        description={
          <>
            Previewing DOCX files directly in the browser with full fidelity is
            complex. <br />
            Consider downloading the file:{" "}
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              Download {fileName || "DOCX File"}
            </a>
            . <br />
            (For a richer preview, the backend could convert DOCX to PDF or
            HTML, or a library like Mammoth.js could be used if the file content
            were available.)
          </>
        }
        type="info"
        showIcon
      />
    );
  }

  return (
    <Alert
      message={`Preview not available for this file type (${
        effectiveFileType || "unknown"
      }).`}
      type="warning"
      showIcon
    />
  );
};
