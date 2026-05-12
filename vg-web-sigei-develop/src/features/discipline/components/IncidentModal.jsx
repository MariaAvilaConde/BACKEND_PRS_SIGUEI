import { useState, useEffect, useRef } from "react";
import { Modal, Button } from "@/shared/components/ui";
import IncidentForm from "./IncidentForm";
import {
     createEmptyIncident,
     formatIncidentForCreate,
     formatIncidentForUpdate,
} from "../models/disciplineModel";
import { alertApiError } from "@/shared/components/feedback";
import { useAuth } from "@/core/auth/AuthContext";
import { studentService } from "@/features/students/services/studentService";
import { isSuccessResponse, extractData } from "@/core/api/apiResponse";

export default function IncidentModal({ isOpen, onClose, incident = null, onSave }) {
     const { user } = useAuth();
     const isEditing = !!incident?.id;
     const [formData, setFormData] = useState(createEmptyIncident());
     const [errors, setErrors] = useState({});
     const [saving, setSaving] = useState(false);
     const formDataRef = useRef(formData);
     const [students, setStudents] = useState([]);
     const [loadingStudents, setLoadingStudents] = useState(false);

     
     useEffect(() => {
          if (isOpen && user?.institutionId) {
               setLoadingStudents(true);
               studentService
                    .getByInstitution(user.institutionId)
                    .then((response) => {
                         const data = isSuccessResponse(response) ? extractData(response) : response;
                         setStudents(Array.isArray(data) ? data : []);
                    })
                    .catch(() => setStudents([]))
                    .finally(() => setLoadingStudents(false));
          }
     }, [isOpen, user?.institutionId]);

     useEffect(() => {
          if (isOpen) {
               const reportedByName = user
                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                    : "";
               const data = incident
                    ? { ...createEmptyIncident(), ...incident }
                    : {
                         ...createEmptyIncident(),
                         reportedBy: reportedByName,
                         institutionId: user?.institutionId || "",
                    };
               setFormData(data);
               formDataRef.current = data;
               setErrors({});
          }
     }, [isOpen, incident, user]);

     function handleFieldChange(field, value) {
          setFormData((prev) => {
               const updated = { ...prev, [field]: value };
               formDataRef.current = updated;
               return updated;
          });
          if (errors[field]) {
               setErrors((prev) => ({ ...prev, [field]: undefined }));
          }
     }

     function validate() {
          const current = formDataRef.current;
          const newErrors = {};

          if (!current.studentId?.trim()) newErrors.studentId = "ID del estudiante requerido";
          if (!current.incidentDate) newErrors.incidentDate = "Fecha requerida";
          if (!current.incidentType) newErrors.incidentType = "Tipo de incidente requerido";
          if (!current.severityLevel) newErrors.severityLevel = "Nivel de severidad requerido";
          if (!current.description?.trim()) newErrors.description = "Descripción requerida";
          if (!current.reportedBy?.trim()) newErrors.reportedBy = "Reportado por es requerido";

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
     }

     async function handleSubmit() {
          if (!validate()) return;

          setSaving(true);
          try {
               const current = formDataRef.current;
               if (isEditing) {
                    await onSave(incident.id, formatIncidentForUpdate(current));
               } else {
                    await onSave(null, formatIncidentForCreate(current));
               }
               onClose();
          } catch (err) {
               alertApiError(err);
          } finally {
               setSaving(false);
          }
     }

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title={isEditing ? "Editar Incidencia" : "Nueva Incidencia"}
               size="xl"
          >
               <div className="space-y-6">
                    <IncidentForm
                         formData={formData}
                         onChange={handleFieldChange}
                         errors={errors}
                         students={students}
                         loadingStudents={loadingStudents}
                    />
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                         <Button variant="ghost" onClick={onClose}>
                              Cancelar
                         </Button>
                         <Button
                              variant="primary"
                              onClick={handleSubmit}
                              loading={saving}
                         >
                              {isEditing ? "Guardar Cambios" : "Registrar Incidencia"}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}
