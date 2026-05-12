import { Route } from 'react-router-dom'
import { ReportCardForm } from '@/features/grades/pages/ReportCardForm'
import { ReportCardDetail } from '@/features/grades/pages/ReportCardDetail'
import { ReportCardList } from '@/features/grades/pages/ReportCardList'

export const notesRoutes = (
  <>
    {/* Boletas de Notas */}
    <Route path="BoletasNotas" element={<ReportCardList />} />
    <Route path="BoletasNotas/nueva" element={<ReportCardForm />} />
    <Route path="BoletasNotas/editar/:id" element={<ReportCardForm isEditing />} />
    <Route path="BoletasNotas/:id" element={<ReportCardDetail />} />
  </>
)