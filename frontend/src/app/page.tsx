"use client";

import React, { useState } from "react";
import { Button, Layout, Result, Breadcrumb } from "antd";
import { HomeOutlined, PlusOutlined } from "@ant-design/icons";
import CreateLessonPlanModal from "@/components/lesson-plans/CreateLessonPlanModal";
import LessonPlanGrid from "@/components/lesson-plans/LessonPlanGrid";
import { LessonPlanDetailModal } from "@/components/lesson-plans/LessonPlanDetailModal";
import { DeleteConfirmationModal } from "@/components/lesson-plans/DeleteConfirmationModal";
import { LessonPlan } from "@/lib/types";
import { useLessonPlanApi } from "@/hooks/useLessonPlanApi";
import { useDisclosure } from "@/hooks/useDisclosure";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const { Header, Content } = Layout;

export default function Page() {
  const createModal = useDisclosure();
  const detailModal = useDisclosure();
  const deleteModal = useDisclosure();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<LessonPlan | null>(null);

  const api = useLessonPlanApi();

  const {
    data: lessonPlansData,
    isLoading: isLoadingPlans,
    isError: isErrorPlans,
    error: errorLoadingPlans,
    refetch: refetchLessonPlans,
  } = api.useGetLessonPlans();

  const deletePlanMutation = api.useDeleteLessonPlan();

  const sortedLessonPlans = React.useMemo(() => {
    if (!lessonPlansData) return [];
    return [...lessonPlansData].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [lessonPlansData]);

  const handleCreateSuccess = () => {
    createModal.close();
  };

  const handleViewDetails = (plan: LessonPlan) => {
    setSelectedPlanId(plan.id);
    detailModal.open();
  };

  const handleDeleteRequest = (plan: LessonPlan) => {
    setPlanToDelete(plan);
    deleteModal.open();
  };

  const confirmDelete = async () => {
    if (planToDelete) {
      deletePlanMutation.mutate(planToDelete.id, {
        onSuccess: () => {
          deleteModal.close();
          setPlanToDelete(null);
        },
        onError: () => {
          setPlanToDelete(null);
        },
      });
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f2f7f8" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#fff",
          padding: "2px 20rem",
          borderBottom: "1px solid #e8e8e8",
          position: "sticky",
          top: 0,
          zIndex: 10,
          width: "100%",
        }}
      >
        <Breadcrumb
          items={[
            {
              href: "",
              title: <HomeOutlined />,
            },
            {
              title: "Plano de Aulas",
            },
          ]}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={createModal.open}
          size="large"
        >
          Adicionar Plano
        </Button>
      </Header>
      <Content
        style={{
          padding: "24px",
          maxWidth: "1300px",
          margin: "24px auto",
          width: "100%",
        }}
      >
        {isLoadingPlans && (
          <LoadingSpinner tip="Carregando planos..." size="large" />
        )}
        {isErrorPlans && !isLoadingPlans && (
          <Result
            status="error"
            title="Erro de Comunicação com o Servidor"
            subTitle={
              errorLoadingPlans?.message ||
              "Não foi possível carregar os planos de aulas. Tente novamente mais tarde."
            }
            extra={
              <Button
                type="primary"
                onClick={() => refetchLessonPlans()}
                loading={isLoadingPlans}
              >
                Tentar Novamente
              </Button>
            }
          />
        )}
        {!isLoadingPlans && !isErrorPlans && lessonPlansData && (
          <LessonPlanGrid
            plans={sortedLessonPlans}
            onViewDetails={handleViewDetails}
            onDeleteRequest={handleDeleteRequest}
            getGeneratedPdfDownloadUrl={api.getGeneratedPdfDownloadUrl}
          />
        )}
      </Content>

      {createModal.isOpen && (
        <CreateLessonPlanModal
          visible={createModal.isOpen}
          onClose={createModal.close}
          onSuccess={handleCreateSuccess}
        />
      )}
      {detailModal.isOpen && selectedPlanId && (
        <LessonPlanDetailModal
          isOpen={detailModal.isOpen}
          onClose={() => {
            detailModal.close();
            setSelectedPlanId(null);
          }}
          planId={selectedPlanId}
        />
      )}
      {deleteModal.isOpen && planToDelete && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => {
            deleteModal.close();
            setPlanToDelete(null);
          }}
          onConfirm={confirmDelete}
          planToDelete={planToDelete}
          isLoading={deletePlanMutation.isPending}
        />
      )}
    </Layout>
  );
}
