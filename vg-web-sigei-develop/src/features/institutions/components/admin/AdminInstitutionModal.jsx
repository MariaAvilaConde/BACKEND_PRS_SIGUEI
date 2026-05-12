import { useState, useEffect, useRef } from "react";
import { Modal, Button } from "@/shared/components/ui";
import InstitutionForm from "../shared/InstitutionForm";
import { ROLES } from "@/core/utils/constants";
import { createEmptyInstitution, formatInstitutionForApi } from "../../models/institutionModel";
import { alertApiError } from "@/shared/components/feedback";
import { userService } from "@/features/users/services/userService";
import { institutionService } from "../../services/institutionService";
import { toast } from "react-hot-toast";

export default function AdminInstitutionModal({
     isOpen,
     onClose,
     institution = null,
     onSave,
     institutions = []
}) {
     const isEditing = !!institution?.id;
     const [formData, setFormData] = useState({ ...createEmptyInstitution(), directorAction: "NEW" });
     const [errors, setErrors] = useState({});
     const [saving, setSaving] = useState(false);
     const [availableDirectors, setAvailableDirectors] = useState([]);
     const formDataRef = useRef(formData);

     useEffect(() => {
          if (isOpen) {
               const data = institution
                    ? { ...createEmptyInstitution(), ...institution, directorAction: "NEW" }
                    : { ...createEmptyInstitution(), directorAction: "NEW" };
               setFormData(data);
               formDataRef.current = data;
               setErrors({});
               
               userService.getAll().then((res) => {
                    const extracted = res?.data || res;
                    if (Array.isArray(extracted)) {
                         const filterDirectors = extracted.filter(u => u.role === "DIRECTOR"); // Add condition if user's institutionId exists if needed
                         setAvailableDirectors(filterDirectors);
                    }
               }).catch(err => console.error(err));
          }
     }, [isOpen, institution]);

     function handleFieldChange(field, value) {
          setFormData((prev) => {
               let updated;
               if (field.startsWith("address.")) {
                    const addressField = field.split(".")[1];
                    updated = {
                         ...prev,
                         address: { ...prev.address, [addressField]: value },
                    };
               } else if (field.startsWith("directorData.")) {
                    const dirField = field.split(".")[1];
                    updated = {
                         ...prev,
                         directorData: { ...prev.directorData, [dirField]: value },
                    };
               } else if (field === "schedules") {
                    updated = { ...prev, schedules: value };
               } else {
                    updated = { ...prev, [field]: value };
               }
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

          // Validación de Código de Institución (8 dígitos numéricos)
          if (current.codeInstitution) {
               if (!/^\d{8}$/.test(current.codeInstitution)) {
                    newErrors.codeInstitution = "Debe tener exactamente 8 dígitos numéricos";
               } else {
                    const isDuplicate = institutions.some(
                         (inst) => inst.codeInstitution === current.codeInstitution && inst.id !== institution?.id
                    );
                    if (isDuplicate) newErrors.codeInstitution = "Este código ya está registrado";
               }
          }

          // Validación de Código Modular (7 dígitos numéricos)
          if (current.modularCode) {
               if (!/^\d{7}$/.test(current.modularCode)) {
                    newErrors.modularCode = "Debe tener exactamente 7 dígitos numéricos";
               } else {
                    const isDuplicate = institutions.some(
                         (inst) => inst.modularCode === current.modularCode && inst.id !== institution?.id
                    );
                    if (isDuplicate) newErrors.modularCode = "Este código modular ya está registrado";
               }
          }

          if (!isEditing) {
               if (!current.codeInstitution?.trim()) newErrors.codeInstitution = "Código de institución requerido";
               if (!current.modularCode?.trim()) newErrors.modularCode = "Código modular requerido";
               if (!current.name?.trim()) newErrors.name = "Nombre requerido";
               if (!current.institutionType) newErrors.institutionType = "Tipo de institución requerido";
               if (!current.level) newErrors.level = "Nivel requerido";
          }

          if (!isEditing || (isEditing && current.isChangingDirector)) {
               
               if (current.directorAction === "NEW") {
                    if (!current.directorData?.firstName?.trim()) newErrors["directorData.firstName"] = "Requerido";
                    if (!current.directorData?.lastName?.trim()) newErrors["directorData.lastName"] = "Requerido";
                    if (!current.directorData?.motherLastName?.trim()) newErrors["directorData.motherLastName"] = "Requerido";
                    if (!current.directorData?.documentNumber?.trim()) newErrors["directorData.documentNumber"] = "Requerido";
                    if (!current.directorData?.phone?.trim()) newErrors["directorData.phone"] = "Requerido";
                    if (!current.directorData?.email?.trim()) newErrors["directorData.email"] = "Requerido";
               } else if (current.directorAction === "EXISTING" && !current.director) {
                    newErrors.director = "Seleccione un director existente";
               }
          }

          // Validación de Horarios
          if (current.schedules?.length > 0) {
               const shifts = current.schedules.filter(s => s.shift).map(s => s.shift);
               if (new Set(shifts).size !== shifts.length) {
                    newErrors.schedules = "No se pueden repetir turnos (máximo uno de mañana y uno de tarde)";
               }

               current.schedules.forEach((s, index) => {
                    if (!s.shift) newErrors[`schedules.${index}.shift`] = "Requerido";
                    if (!s.startTime) newErrors[`schedules.${index}.startTime`] = "Requerido";
                    if (!s.endTime) newErrors[`schedules.${index}.endTime`] = "Requerido";
                    
                    if (s.startTime && s.endTime) {
                         if (s.startTime >= s.endTime) {
                              newErrors[`schedules.${index}.endTime`] = "Debe ser posterior al inicio";
                         }

                         if (s.shift === "MAÑANA") {
                              if (s.startTime < "07:00") {
                                   newErrors[`schedules.${index}.startTime`] = "Mínimo 07:00 AM";
                              }
                              if (s.endTime > "13:00") {
                                   newErrors[`schedules.${index}.endTime`] = "Máximo 13:00 (1:00 PM)";
                              }
                         } else if (s.shift === "TARDE") {
                              if (s.startTime < "12:00") {
                                   newErrors[`schedules.${index}.startTime`] = "Mínimo 12:00 PM";
                              }
                              if (s.endTime > "18:00") {
                                   newErrors[`schedules.${index}.endTime`] = "Máximo 18:00 (6:00 PM)";
                              }
                         }
                    }
               });
          }

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
     }

     async function handleSubmit() {
          if (!validate()) return;

          setSaving(true);
          try {
               const current = formDataRef.current;
               
               if (current.logoFile) {
                    toast.loading("Subiendo logo...", { id: "upload-logo-modal" });
                    const uploadRes = await institutionService.uploadLogo(current.logoFile);
                    current.logoUrl = uploadRes.data || uploadRes;
                    delete current.logoFile;
                    toast.success("Logo subido exitosamente", { id: "upload-logo-modal" });
               }

               if (isEditing) {
                    let newDirectorId = current.director;

                    if (current.isChangingDirector) {
                         
                         if (current.directorAction === "NEW") {
                              const userPayload = {
                                   userName: current.directorData.documentNumber,
                                   email: current.directorData.email,
                                   firstName: current.directorData.firstName,
                                   lastName: current.directorData.lastName,
                                   motherLastName: current.directorData.motherLastName,
                                   documentType: current.directorData.documentType,
                                   documentNumber: current.directorData.documentNumber,
                                   phone: current.directorData.phone,
                                   role: "DIRECTOR",
                                   institutionId: institution.id
                              };
                              const createdUser = await userService.create(userPayload);
                              newDirectorId = createdUser?.data?.id || createdUser?.id;
                         }

                         
                         await onSave(institution.id, { director: newDirectorId });
                    }
               } else {
                    const instPayload = formatInstitutionForApi(current);
                    instPayload.directorId = current.directorAction === "EXISTING" ? current.director : null;

                    const createdInst = await onSave(null, instPayload);
                    const newInstId = createdInst?.data?.id || createdInst?.id;

                    if (newInstId && current.directorAction === "NEW") {
                         const userPayload = {
                              userName: current.directorData.documentNumber,
                              email: current.directorData.email,
                              firstName: current.directorData.firstName,
                              lastName: current.directorData.lastName,
                              motherLastName: current.directorData.motherLastName,
                              documentType: current.directorData.documentType,
                              documentNumber: current.directorData.documentNumber,
                              phone: current.directorData.phone,
                              role: "DIRECTOR",
                              institutionId: newInstId
                         };
                         try {
                              const createdUser = await userService.create(userPayload);

                              const userId = createdUser?.data?.id || createdUser?.id;
                              if (userId) {
                                   await institutionService.update(newInstId, { ...instPayload, directorId: userId });
                              }
                         } catch (userErr) {
                              await institutionService.delete(newInstId);
                              throw userErr;
                         }
                    }
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
               title={isEditing ? "Editar Institución" : "Nueva Institución"}
               size="xl"
          >
               <div className="space-y-6">
                    <InstitutionForm
                         institution={formData}
                         role={ROLES.ADMINISTRADOR}
                         onChange={handleFieldChange}
                         errors={errors}
                         availableDirectors={availableDirectors}
                    />

                    {isEditing && (
                         <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                              <p className="text-xs text-amber-700">
                                   <strong>Nota:</strong> Como administrador, solo puede modificar el campo
                                   "Director" de la institución.
                              </p>
                         </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                         <Button variant="ghost" onClick={onClose} disabled={saving}>
                              Cancelar
                         </Button>
                         <Button
                              variant="primary"
                              onClick={handleSubmit}
                              loading={saving}
                         >
                              {isEditing ? "Guardar Cambios" : "Crear Institución"}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}
