import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { useAcademicPeriods } from "../hooks/useAcademicPeriods";
import { AcademicPeriodList } from "../components/academic-periods/AcademicPeriodList";
import { AcademicPeriodForm } from "../components/academic-periods/AcademicPeriodForm";
import { Modal } from "../components/shared/Modal";
import { formatAcademicPeriodForApi, formatAcademicPeriodUpdateForApi } from "../models/academicPeriodModel";

/**
 * Página de gestión de períodos académicos
 */
export default function AcademicPeriodsPage() {
  useAuth();
  const {
    periods,
    loading,
    fetchAll,
    createPeriod,
    updatePeriod,
    deletePeriod,
    activatePeriod,
    closePeriod,
  } = useAcademicPeriods();

  const [showModal, setShowModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Evitar llamadas duplicadas
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAll();
    }
  }, [fetchAll]);

  const handleCreate = () => {
    setEditingPeriod(null);
    setShowModal(true);
  };

  const handleEdit = (period) => {
    setEditingPeriod(period);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPeriod(null);
  };

  const handleSubmit = async (periodData) => {
    console.log("Enviando datos del período:", periodData);
    setIsSubmitting(true);
    try {
      if (editingPeriod) {
        // Actualizar período existente
        const payload = formatAcademicPeriodUpdateForApi(periodData);
        console.log("Payload para actualización:", payload);
        await updatePeriod(editingPeriod.id, payload);
      } else {
        // Crear nuevo período
        const payload = formatAcademicPeriodForApi(periodData);
        console.log("Payload para creación:", payload);
        const result = await createPeriod(payload);
        console.log("Resultado de creación:", result);
      }
      handleCloseModal();
      fetchAll(); // Recargar lista
    } catch (error) {
      console.error("Error al guardar período:", error);
      // El error ya se maneja en el hook con alertApiError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await deletePeriod(id);
    if (result) {
      fetchAll(); // Recargar lista
    }
  };

  const handleActivate = async (id) => {
    try {
      await activatePeriod(id);
      fetchAll(); // Recargar lista
    } catch (error) {
      console.error("Error al activar período:", error);
    }
  };

  const handleClose = async (id) => {
    try {
      await closePeriod(id);
      fetchAll(); // Recargar lista
    } catch (error) {
      console.error("Error al cerrar período:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Períodos Académicos</h1>
          <p className="text-gray-600 mt-1">Gestiona los períodos académicos y fechas de matrícula</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nuevo Período
        </button>
      </div>

      {/* Lista de períodos */}
      <AcademicPeriodList
        periods={periods}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onActivate={handleActivate}
        onClose={handleClose}
        isLoading={loading}
      />

      {/* Modal de formulario */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingPeriod ? "Editar Período Académico" : "Nuevo Período Académico"}
        size="2xl"
      >
        <AcademicPeriodForm
          period={editingPeriod}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}
