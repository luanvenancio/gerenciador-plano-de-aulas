"use client";
import React, { useEffect, useState } from "react";
import mammoth from "mammoth";
import { Alert } from "antd";
import { LoadingSpinner } from "./LoadingSpinner";
import Image from "next/image";

interface FilePreviewProps {
  file: File | null;
}

export default function FilePreview({ file }: FilePreviewProps) {
  const [previewData, setPreviewData] = useState<{
    url: string | null;
    type: "pdf" | "html" | "image" | "unsupported";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const reader = new FileReader();
    let objectUrl: string | null = null;

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

    if (file.type === "application/pdf") {
      objectUrl = URL.createObjectURL(file);
      setPreviewData({ url: objectUrl, type: "pdf" });
      setLoading(false);
    } else if (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      reader.onload = async (e) => {
        try {
          if (e.target?.result) {
            const arrayBuffer = e.target.result as ArrayBuffer;
            const result = await mammoth.convertToHtml({ arrayBuffer });
            const htmlBlob = new Blob(
              [
                `<html><head><style>body{font-family:sans-serif;padding:20px;}</style></head><body>${result.value}</body></html>`,
              ],
              { type: "text/html" }
            );
            objectUrl = URL.createObjectURL(htmlBlob);
            setPreviewData({ url: objectUrl, type: "html" });
          }
        } catch (err) {
          console.error("Error converting DOCX to HTML:", err);
          setError("Failed to generate DOCX preview.");
          setPreviewData({ url: null, type: "unsupported" });
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read DOCX file.");
        setPreviewData({ url: null, type: "unsupported" });
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type.startsWith("image/")) {
      objectUrl = URL.createObjectURL(file);
      setPreviewData({ url: objectUrl, type: "image" });
      setLoading(false);
    } else {
      setError(
        `Preview not supported for file type: ${
          file.type || file.name.split(".").pop()
        }`
      );
      setPreviewData({ url: null, type: "unsupported" });
      setLoading(false);
    }
    return cleanup;
  }, [file]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <LoadingSpinner tip="Carregando prévia..." />
      </div>
    );
  }
  if (error) {
    return (
      <Alert
        message="Preview Error"
        description={error}
        type="error"
        showIcon
      />
    );
  }
  if (!previewData || !previewData.url) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "20px",
          border: "1px dashed #d9d9d9",
          borderRadius: "4px",
        }}
      >
        Selecione um arquivo para ver a prévia
      </div>
    );
  }
  if (previewData.type === "pdf" || previewData.type === "html") {
    return (
      <iframe
        src={previewData.url}
        style={{ width: "100%", height: "400px", border: "1px solid #d9d9d9" }}
        title="File Preview"
        sandbox="allow-scripts"
      />
    );
  }
  if (previewData.type === "image") {
    return (
      <Image
        src={previewData.url}
        alt="File Preview"
        fill
        style={{
          maxWidth: "100%",
          maxHeight: "400px",
          border: "1px solid #d9d9d9",
          display: "block",
          margin: "0 auto",
        }}
      />
    );
  }
  return (
    <Alert
      message="Prévia Indisponível"
      description="Não é possivél mostrar uma prévia desse formato de arquivo"
      type="warning"
      showIcon
    />
  );
}
