import React from "react";
import { Modal, Typography, Alert } from "antd";
import { LessonPlan } from "@/lib/types";

const { Text } = Typography;

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  planToDelete: LessonPlan | null;
  isLoading: boolean;
  error?: string | null;
}

export const DeleteConfirmationModal: React.FC<
  DeleteConfirmationModalProps
> = ({ isOpen, onClose, onConfirm, planToDelete, isLoading, error }) => {
  if (!planToDelete) return null;

  return (
    <Modal
      title="Deseja Apagar?"
      open={isOpen}
      onOk={onConfirm}
      onCancel={onClose}
      confirmLoading={isLoading}
      okText="Delete"
      okButtonProps={{ danger: true }}
      cancelButtonProps={{ disabled: isLoading }}
    >
      <Text>Você tem certeza que deseja apagar: </Text>
      <Text strong>{planToDelete.title || planToDelete.originalFileName}</Text>?
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Modal>
  );
};
