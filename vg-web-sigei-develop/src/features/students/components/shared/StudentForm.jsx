import { useState, useEffect } from "react";
import { Input, Select } from "@/shared/components/ui";
import { FormSection } from "@/shared/components/form";
import {
     createEmptyStudent,
     GENDERS,
     BLOOD_TYPES,
} from "../../models/studentModel";
import { DOCUMENT_TYPES } from "@/core/utils/constants";
import {
     filterNameInput,
     filterCUIInput,
     filterDocumentInput,
     getBirthDateRange,
} from "@/core/utils/validators";

const genderOptions = GENDERS.map((g) => ({ value: g.value, label: g.label }));
const documentTypeOptions = DOCUMENT_TYPES.map((d) => ({ value: d, label: d }));
const bloodTypeOptions = BLOOD_TYPES.map((b) => ({ value: b, label: b }));

export default function StudentForm({
     student,
     onChange,
     errors = {},
     readOnly = false,
     onFieldBlur,
     classroomOptions = [],
     loadingClassrooms = false,
}) {
     const [form, setForm] = useState(createEmptyStudent());
     const birthRange = getBirthDateRange();
     const baseClassroomOptions = Array.isArray(classroomOptions) ? classroomOptions : [];
     const fallbackClassroomLabel = form.classroomName || form.classroomLabel || "Aula asignada";
     const classroomOptionsWithSelected =
          form.classroomId && !baseClassroomOptions.some((option) => option.value === form.classroomId)
               ? [{ value: form.classroomId, label: fallbackClassroomLabel }, ...baseClassroomOptions]
               : baseClassroomOptions;
     const selectedClassroomOption = classroomOptionsWithSelected.find(
          (option) => option.value === form.classroomId
     );
     const readOnlyClassroomValue = selectedClassroomOption?.label
          ? selectedClassroomOption.label
          : form.classroomName || "Sin aula asignada";

     useEffect(() => {
          if (student) {
               setForm({ ...createEmptyStudent(), ...student });
          } else {
               setForm(createEmptyStudent());
          }
     }, [student]);

     function handleChange(field, value) {
          setForm((prev) => {
               const updated = { ...prev, [field]: value };
               onChange?.(field, value);
               if (field === "cui") {
                    const digits = value.replace(/\D/g, "");
                    if (digits.length >= 8 && (updated.documentType === "DNI" || !updated.documentType)) {
                         const docNum = digits.slice(0, 8);
                         updated.documentNumber = docNum;
                         onChange?.("documentNumber", docNum);
                    }
               }
               return updated;
          });
     }

     function handleDocTypeChange(value) {
          handleChange("documentType", value);
          const digits = form.cui?.replace(/\D/g, "") || "";
          if (value === "DNI" && digits.length >= 8) {
               handleChange("documentNumber", digits.slice(0, 8));
          } else {
               handleChange("documentNumber", "");
          }
     }

     return (
          <div className="space-y-6">
               <FormSection title="Datos Personales" description="Información básica del estudiante">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input
                              label="CUI"
                              value={form.cui}
                              onChange={(e) => handleChange("cui", e.target.value)}
                              onBlur={() => onFieldBlur?.("cui")}
                              filter={filterCUIInput}
                              disabled={readOnly}
                              error={errors.cui}
                              placeholder="XXXXXXXX-X"
                              maxLength={10}
                         />
                         <Input
                              label="Nombres"
                              value={form.firstName}
                              onChange={(e) => handleChange("firstName", e.target.value)}
                              filter={filterNameInput}
                              disabled={readOnly}
                              error={errors.firstName}
                              placeholder="Nombres del estudiante"
                         />
                         <Input
                              label="Apellido Paterno"
                              value={form.lastName}
                              onChange={(e) => handleChange("lastName", e.target.value)}
                              filter={filterNameInput}
                              disabled={readOnly}
                              error={errors.lastName}
                              placeholder="Apellido paterno"
                         />
                         <Input
                              label="Apellido Materno"
                              value={form.motherLastName}
                              onChange={(e) => handleChange("motherLastName", e.target.value)}
                              filter={filterNameInput}
                              disabled={readOnly}
                              error={errors.motherLastName}
                              placeholder="Apellido materno"
                         />
                         <Select
                              label="Tipo de Documento"
                              value={form.documentType}
                              onChange={(e) => handleDocTypeChange(e.target.value)}
                              disabled={readOnly}
                              options={documentTypeOptions}
                              error={errors.documentType}
                         />
                         <Input
                              label="Número de Documento"
                              value={form.documentNumber}
                              onChange={(e) => handleChange("documentNumber", e.target.value)}
                              onBlur={() => onFieldBlur?.("documentNumber")}
                              filter={(v) => filterDocumentInput(form.documentType, v)}
                              disabled={readOnly}
                              error={errors.documentNumber}
                              placeholder={form.documentType === "DNI" ? "8 dígitos" : "9-12 caracteres"}
                              maxLength={form.documentType === "DNI" ? 8 : 12}
                         />
                         <Select
                              label="Género"
                              value={form.gender}
                              onChange={(e) => handleChange("gender", e.target.value)}
                              disabled={readOnly}
                              options={genderOptions}
                              placeholder="Seleccione género"
                              error={errors.gender}
                         />
                         <Input
                              label="Fecha de Nacimiento"
                              type="date"
                              value={form.dateOfBirth}
                              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                              min={birthRange.min}
                              max={birthRange.max}
                              disabled={readOnly}
                              error={errors.dateOfBirth}
                         />
                    </div>
                    <Input
                         label="Dirección"
                         value={form.address}
                         onChange={(e) => handleChange("address", e.target.value)}
                         disabled={readOnly}
                         error={errors.address}
                         placeholder="Dirección del estudiante"
                    />
               </FormSection>

               {readOnly && (
                    <FormSection title="Ubicación Escolar" description="Aula asignada en la institución">
                         <Input
                              label="Aula"
                              value={readOnlyClassroomValue}
                              disabled
                         />
                    </FormSection>
               )}

               <FormSection title="Información Médica" description="Datos de salud relevantes">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Select
                              label="Grupo Sanguíneo"
                              value={form.bloodType}
                              onChange={(e) => handleChange("bloodType", e.target.value)}
                              disabled={readOnly}
                              options={bloodTypeOptions}
                              placeholder="Seleccione grupo"
                              error={errors.bloodType}
                         />
                         <Input
                              label="Alergias"
                              value={form.allergies}
                              onChange={(e) => handleChange("allergies", e.target.value)}
                              disabled={readOnly}
                              placeholder="Alergias conocidas"
                         />
                         <Input
                              label="Medicamentos"
                              value={form.medications}
                              onChange={(e) => handleChange("medications", e.target.value)}
                              disabled={readOnly}
                              placeholder="Medicamentos actuales"
                         />
                         <Input
                              label="Condiciones Médicas"
                              value={form.conditions}
                              onChange={(e) => handleChange("conditions", e.target.value)}
                              disabled={readOnly}
                              placeholder="Condiciones especiales"
                         />
                    </div>
                    <Input
                         label="Notas de Emergencia"
                         value={form.emergencyNotes}
                         onChange={(e) => handleChange("emergencyNotes", e.target.value)}
                         disabled={readOnly}
                         placeholder="Instrucciones en caso de emergencia"
                    />
               </FormSection>

               <FormSection title="Desarrollo" description="Evaluación del desarrollo del estudiante">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input
                              label="Desarrollo Motor"
                              value={form.motorDevelopment}
                              onChange={(e) => handleChange("motorDevelopment", e.target.value)}
                              disabled={readOnly}
                              placeholder="Observaciones del desarrollo motor"
                         />
                         <Input
                              label="Desarrollo del Lenguaje"
                              value={form.languageDevelopment}
                              onChange={(e) => handleChange("languageDevelopment", e.target.value)}
                              disabled={readOnly}
                              placeholder="Observaciones del desarrollo del lenguaje"
                         />
                         <Input
                              label="Desarrollo Social"
                              value={form.socialDevelopment}
                              onChange={(e) => handleChange("socialDevelopment", e.target.value)}
                              disabled={readOnly}
                              placeholder="Observaciones del desarrollo social"
                         />
                         <Input
                              label="Observaciones Generales"
                              value={form.developmentObservations}
                              onChange={(e) => handleChange("developmentObservations", e.target.value)}
                              disabled={readOnly}
                              placeholder="Observaciones adicionales"
                         />
                    </div>
               </FormSection>
          </div>
     );
}
