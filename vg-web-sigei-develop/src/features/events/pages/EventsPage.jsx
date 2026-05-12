import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
     Plus, Calendar, RefreshCw, Trash2, Edit, RotateCcw, Eye, 
     List, CalendarDays, LayoutGrid, ArrowLeft, CalendarRange, FileDown
} from "lucide-react";
import { eventService } from "../services/eventService";
import { calendarService } from "../services/calendarService";
import { eventReportService } from "../services/eventReportService";
import { 
     createEmptyEvent,
     createEmptyEventWithYear,
     formatEventForCreate, 
     formatEventForUpdate,
     EVENT_TYPE_LABELS,
     EVENT_TYPE_OPTIONS,
     EVENT_STATUS,
     EVENT_STATUS_LABELS,
     generatePeruCivicEventsForYear,
     hasPeruCivicDatesIncluded,
} from "../models/eventModel";
import {
     createEmptyCalendar,
     formatCalendarForCreate,
     formatCalendarForUpdate,
     validateCalendarDates,
     isCalendarInactive,
     isCalendarActiveStatus,
     getCalendarDuration
} from "../models/calendarModel";
import { useAuth } from "@/core/auth/AuthContext";
import { Button, Modal, Input, Select, Badge, Spinner } from "@/shared/components/ui";
import { SearchInput } from "@/shared/components/form";
import { 
     alertSuccess, 
     alertError, 
     alertConfirmDelete, 
     alertConfirmRestore,
     alertApiError
} from "@/shared/components/feedback";
import { formatDate, formatDateShortMonth } from "@/core/utils/formatters";
import CalendarView from "../components/CalendarView";
import YearCardsView from "../components/YearCardsView";

export default function EventsPage() {
     const { user } = useAuth();
     
     // Estados para calendarios
     const [calendars, setCalendars] = useState([]);
     const [selectedCalendar, setSelectedCalendar] = useState(null);
     const [filteredCalendars, setFilteredCalendars] = useState([]);
     const [calendarSearchTerm, setCalendarSearchTerm] = useState("");
     const [calendarStatusFilter, setCalendarStatusFilter] = useState("ACTIVE");
     const [calendarModalOpen, setCalendarModalOpen] = useState(false);
     const [calendarFormData, setCalendarFormData] = useState(createEmptyCalendar());
     const [editingCalendarId, setEditingCalendarId] = useState(null);
     
     // Estados para eventos
     const [events, setEvents] = useState([]);
     const [filteredEvents, setFilteredEvents] = useState([]);
     const [loading, setLoading] = useState(true);
     const [searchTerm, setSearchTerm] = useState("");
     const [statusFilter, setStatusFilter] = useState("ACTIVE");
     const [typeFilter, setTypeFilter] = useState("");
     const [modalOpen, setModalOpen] = useState(false);
     const [viewModalOpen, setViewModalOpen] = useState(false);
     const [selectedEvent, setSelectedEvent] = useState(null);
     const [formData, setFormData] = useState(createEmptyEvent());
     const [saving, setSaving] = useState(false);
     const [reporting, setReporting] = useState(false);
     const [viewMode, setViewMode] = useState("list"); // "list", "calendar", o "year-cards"

     // ============================================
     // CARGA DE CALENDARIOS
     // ============================================
     const loadCalendars = useCallback(async () => {
          if (!user?.institutionId) {
               alertError(
                    "No se pudo identificar la institución del usuario. " +
                    "Por favor, cierre sesión y vuelva a iniciar sesión."
               );
               setLoading(false);
               return;
          }

          try {
               setLoading(true);
               const response = await calendarService.getByInstitution(user.institutionId);
               const calendarsData = Array.isArray(response) ? response : [];
               setCalendars((previousCalendars) => {
                    // El backend actual lista solo ACTIVE; preservamos INACTIVE locales
                    // para que el usuario pueda verlos al filtrar por inactivos.
                    const activeIds = new Set(calendarsData.map((cal) => cal.id));
                    const localInactiveCalendars = previousCalendars.filter(
                         (cal) => isCalendarInactive(cal) && !activeIds.has(cal.id)
                    );

                    return [...calendarsData, ...localInactiveCalendars];
               });
          } catch (error) {
               alertError("Error al cargar calendarios", error?.response?.data?.message || "Error desconocido");
               setCalendars([]);
          } finally {
               setLoading(false);
          }
     }, [user]);

     const filterCalendars = useCallback(() => {
          let filtered = [...calendars];

          if (calendarStatusFilter === "ACTIVE") {
               filtered = filtered.filter((calendar) => isCalendarActiveStatus(calendar));
          } else if (calendarStatusFilter === "INACTIVE") {
               filtered = filtered.filter((calendar) => isCalendarInactive(calendar));
          }

          if (calendarSearchTerm) {
               filtered = filtered.filter(calendar =>
                    calendar.academicYear?.toString().includes(calendarSearchTerm) ||
                    calendar.academicYearName?.toLowerCase().includes(calendarSearchTerm.toLowerCase())
               );
          }

          setFilteredCalendars(filtered);
     }, [calendars, calendarSearchTerm, calendarStatusFilter]);

     // ============================================
     // CARGA DE EVENTOS (por calendario)
     // ============================================
     const loadEvents = useCallback(async () => {
          if (!selectedCalendar) return;
          
          if (!user?.institutionId) {
               alertError(
                    "No se pudo identificar la institución del usuario. " +
                    "Por favor, cierre sesión y vuelva a iniciar sesión."
               );
               setLoading(false);
               return;
          }

          try {
               setLoading(true);
               // Obtener eventos del calendario específico
               const response = await calendarService.getWithEvents(selectedCalendar.id);
               const eventsData = response.events || [];
               setEvents(eventsData);
          } catch (error) {
               alertError("Error al cargar eventos", error?.response?.data?.message || "Error desconocido");
               setEvents([]);
          } finally {
               setLoading(false);
          }
     }, [selectedCalendar, user]);

     const filterEvents = useCallback(() => {
          let filtered = [...events];

          // Filtro por estado
          if (statusFilter === "ACTIVE" || statusFilter === "INACTIVE") {
               filtered = filtered.filter((event) => event.status === statusFilter);
          }

          // Filtro por búsqueda
          if (searchTerm) {
               filtered = filtered.filter(event => 
                    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
               );
          }

          // Filtro por tipo
          if (typeFilter) {
               filtered = filtered.filter(event => event.eventType === typeFilter);
          }

          setFilteredEvents(filtered);
     }, [events, searchTerm, typeFilter, statusFilter]);

     // ============================================
     // EFFECTS
     // ============================================
     useEffect(() => {
          if (selectedCalendar) {
               loadEvents();
          } else {
               loadCalendars();
          }
     }, [selectedCalendar, loadEvents, loadCalendars]);

     useEffect(() => {
          if (selectedCalendar) {
               filterEvents();
          } else {
               filterCalendars();
          }
     }, [selectedCalendar, filterEvents, filterCalendars]);

     // ============================================
     // HANDLERS DE CALENDARIOS
     // ============================================
     const handleSelectCalendar = (calendar) => {
          setSelectedCalendar(calendar);
          setViewMode("list"); // Reset a vista lista
          setSearchTerm(""); // Limpiar búsqueda
          setTypeFilter(""); // Limpiar filtros
     };

     const handleBackToCalendars = () => {
          setSelectedCalendar(null);
          setEvents([]);
          setFilteredEvents([]);
     };

     // ============================================
     // HANDLERS DE CALENDARIOS (Editar, Eliminar, Reactivar)
     // ============================================
     const handleOpenEditCalendar = async (calendar) => {
          try {
               // Cargar eventos del calendario para verificar si tiene fechas cívicas
               const calendarWithEvents = await calendarService.getWithEvents(calendar.id);
               const hasCivicDates = hasPeruCivicDatesIncluded(calendarWithEvents?.events || []);

               setEditingCalendarId(calendar.id);
               setCalendarFormData({
                    ...calendar,
                    includeCivicDates: hasCivicDates, // Marcar si ya tiene fechas cívicas
               });
               setCalendarModalOpen(true);
          } catch (error) {
               console.error("Error al cargar datos del calendario:", error);
               // Fallback: abrir modal sin verificar fechas cívicas
               setEditingCalendarId(calendar.id);
               setCalendarFormData({
                    ...calendar,
                    includeCivicDates: false,
               });
               setCalendarModalOpen(true);
          }
     };

     const handleDeleteCalendar = async (calendar) => {
          const result = await alertConfirmDelete("calendario");
          if (!result.isConfirmed) return;

          try {
               setSaving(true);
               await calendarService.delete(calendar.id);
               setCalendars((previousCalendars) =>
                    previousCalendars.map((item) =>
                         item.id === calendar.id
                              ? { ...item, status: "INACTIVE" }
                              : item
                    )
               );
               alertSuccess("Calendario eliminado correctamente");

               // Si el calendario eliminado estaba seleccionado, volver a calendarios
               if (selectedCalendar?.id === calendar.id) {
                    setSelectedCalendar(null);
               }
          } catch (error) {
               alertApiError(error);
          } finally {
               setSaving(false);
          }
     };

     const handleReactivateCalendar = async (calendar) => {
          const result = await alertConfirmRestore("calendario");
          if (!result.isConfirmed) return;

          try {
               setSaving(true);
               await calendarService.reactivate(calendar.id);
               setCalendars((previousCalendars) =>
                    previousCalendars.map((item) =>
                         item.id === calendar.id
                              ? { ...item, status: "ACTIVE" }
                              : item
                    )
               );
               alertSuccess("Calendario reactivado correctamente");
               loadCalendars();
          } catch (error) {
               alertApiError(error);
          } finally {
               setSaving(false);
          }
     };

     const handleOpenCreateCalendar = () => {
          setEditingCalendarId(null);
          setCalendarFormData(createEmptyCalendar());
          setCalendarModalOpen(true);
     };

     const handleSubmitCalendar = async (e) => {
          e.preventDefault();

          const validation = validateCalendarDates(calendarFormData.startDate, calendarFormData.endDate);
          if (!validation.valid) {
               alertError(validation.message);
               return;
          }

          try {
               setSaving(true);
               let newCalendarId = null;
               
               if (editingCalendarId) {
                    // Modo edición
                    const updateData = formatCalendarForUpdate(calendarFormData);
                    await calendarService.update(editingCalendarId, updateData);
                    newCalendarId = editingCalendarId;
                    alertSuccess("Calendario actualizado correctamente");
               } else {
                    // Modo creación
                    const createData = formatCalendarForCreate(calendarFormData, user.institutionId);
                    const newCalendarResponse = await calendarService.create(createData);
                    newCalendarId = newCalendarResponse?.data?.id || newCalendarResponse?.id;
               }
               
               // ✨ Si el usuario seleccionó incluir fechas cívicas, crearlas automáticamente
               if (calendarFormData.includeCivicDates && newCalendarId) {
                    try {
                         const civicEvents = generatePeruCivicEventsForYear(calendarFormData.academicYear);
                         
                         // Crear todos los eventos cívicos
                         const createdEventIds = [];
                         for (const event of civicEvents) {
                              const eventPayload = {
                                   ...event,
                                   institutionId: user.institutionId,
                                   createdBy: user?.username || "system"
                              };
                              const createdEvent = await eventService.create(eventPayload);
                              createdEventIds.push(createdEvent?.data?.id || createdEvent?.id);
                         }
                         
                         // Asignar todos los eventos al calendario
                         if (createdEventIds.length > 0) {
                              await calendarService.addEvents(newCalendarId, createdEventIds);
                         }
                         
                         const message = editingCalendarId
                              ? `Calendarios actualizado y se agregaron ${civicEvents.length} fechas cívicas peruanas`
                              : `Calendario creado con ${civicEvents.length} fechas cívicas peruanas`;
                         alertSuccess(message);
                    } catch (civicError) {
                         console.error("Error al crear fechas cívicas:", civicError);
                         const message = editingCalendarId
                              ? "Calendario actualizado, pero hubo un error al agregar fechas cívicas"
                              : "Calendario creado, pero hubo un error al agregar fechas cívicas";
                         alertSuccess(message);
                    }
               } else if (!editingCalendarId) {
                    alertSuccess("Calendario creado correctamente");
               }
               
               setCalendarModalOpen(false);
               setEditingCalendarId(null);
               loadCalendars();
          } catch (error) {
               alertApiError(error);
          } finally {
               setSaving(false);
          }
     };

     // ============================================
     // HANDLERS DE EVENTOS
     // ============================================
     const handleOpenCreate = () => {
          // Si hay un calendario seleccionado, usar el año del calendario en la fecha inicial
          if (selectedCalendar) {
               setFormData(createEmptyEventWithYear(selectedCalendar.academicYear));
          } else {
               setFormData(createEmptyEvent());
          }
          setSelectedEvent(null);
          setModalOpen(true);
     };

     const handleOpenEdit = (event) => {
          // Validación de seguridad
          if (event.institutionId !== user?.institutionId) {
               alertError("No tienes permisos para editar este evento");
               return;
          }
          
          setSelectedEvent(event);
          setFormData({
               title: event.title || "",
               description: event.description || "",
               startDate: event.startDate || "",
               endDate: event.endDate || "",
               eventType: event.eventType || "CIVICO",
               isHoliday: event.isHoliday || false,
               isRecurring: event.isRecurring || false,
               isNational: event.isNational || false,
               affectsClasses: event.affectsClasses || false,
          });
          setModalOpen(true);
     };

     const handleOpenView = (event) => {
          setSelectedEvent(event);
          setViewModalOpen(true);
     };

     const handleSubmit = async (e) => {
          e.preventDefault();
          
          if (!formData.title?.trim()) {
               alertError("El título es obligatorio");
               return;
          }

          if (!formData.startDate) {
               alertError("La fecha de inicio es obligatoria");
               return;
          }

          // ✅ VALIDACIÓN: El año del evento DEBE coincidir con el año del calendario
          const eventYear = new Date(formData.startDate).getFullYear();
          if (eventYear !== selectedCalendar.academicYear) {
               alertError(
                    `El evento debe pertenecer al año ${selectedCalendar.academicYear}. ` +
                    `No puedes crear un evento del año ${eventYear} en este calendario.`
               );
               return;
          }

          // Validación de seguridad al actualizar
          if (selectedEvent && selectedEvent.institutionId !== user?.institutionId) {
               alertError("No tienes permisos para modificar este evento");
               return;
          }

          try {
               setSaving(true);
               
               if (selectedEvent) {
                    // Actualizar
                    const payload = formatEventForUpdate(formData);
                    await eventService.update(selectedEvent.id, payload);
                    alertSuccess("Evento actualizado correctamente");
               } else {
                    // Crear evento y asignarlo al calendario automáticamente
                    const payload = formatEventForCreate(
                         formData, 
                         user?.institutionId || "DEFAULT_INST", 
                         user?.username || "system"
                    );
                    const createdEvent = await eventService.create(payload);
                    
                    // Asignar evento al calendario
                    await calendarService.addEvents(selectedCalendar.id, [createdEvent.data.id]);
                    
                    alertSuccess("Evento creado y asignado al calendario correctamente");
               }
               
               setModalOpen(false);
               loadEvents();
          } catch (error) {
               alertApiError(error);
          } finally {
               setSaving(false);
          }
     };

     const handleDelete = async (event) => {
          if (event.institutionId !== user?.institutionId) {
               alertError("No tienes permisos para eliminar este evento");
               return;
          }
          
          const result = await alertConfirmDelete("evento");
          if (!result.isConfirmed) return;

          try {
               await eventService.delete(event.id);
               alertSuccess("Evento eliminado correctamente");
               loadEvents();
          } catch (error) {
               alertApiError(error);
          }
     };

     const handleRestore = async (event) => {
          if (event.institutionId !== user?.institutionId) {
               alertError("No tienes permisos para restaurar este evento");
               return;
          }
          
          const result = await alertConfirmRestore("evento");
          if (!result.isConfirmed) return;

          try {
               await eventService.restore(event.id);
               alertSuccess("Evento restaurado correctamente");
               loadEvents();
          } catch (error) {
               alertApiError(error);
          }
     };

     const handleGenerateReport = async (format) => {
          if (!selectedCalendar) {
               alertError("Debes seleccionar un calendario para generar reporte");
               return;
          }

          if (!filteredEvents.length) {
               alertError("No hay eventos para generar reporte con los filtros actuales");
               return;
          }

          try {
               setReporting(true);

               const reportPayload = {
                    events: filteredEvents,
                    calendar: selectedCalendar,
                    filters: {
                         statusFilter,
                         typeFilter,
                         searchTerm,
                    },
                    generatedBy: user?.username || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Sistema",
               };

               if (format === "pdf") {
                    eventReportService.generatePdfReport(reportPayload);
                    alertSuccess("Reporte PDF generado correctamente");
                    return;
               }

               eventReportService.generateCsvReport(reportPayload);
               alertSuccess("Reporte CSV generado correctamente");
          } catch (error) {
               alertApiError(error);
          } finally {
               setReporting(false);
          }
     };

     const getTypeBadgeColor = (type) => {
          const colors = {
               CIVICO: "blue",
               CULTURAL: "purple",
               RELIGIOSO: "orange",
               INSTITUCIONAL: "green",
          };
          return colors[type] || "gray";
     };

     // ============================================
     // RENDER: VISTA DE CALENDARIOS
     // ============================================
     if (!selectedCalendar) {
          return (
               <div>
                    {/* Header Calendarios */}
                    <motion.div
                         initial={{ opacity: 0, y: -10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="mb-6"
                    >
                         <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                              <div className="min-w-0 flex-1">
                                   <h1 className="text-lg md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        <CalendarRange className="w-5 h-5 md:w-7 md:h-7 text-primary-600 flex-shrink-0" />
                                        <span className="truncate">Calendarios Académicos</span>
                                   </h1>
                                   <p className="text-gray-500 text-xs md:text-sm mt-1">
                                        Gestión de eventos por año académico
                                   </p>
                              </div>
                              <div className="flex gap-2 w-full md:w-auto">
                                   <Button
                                        onClick={loadCalendars}
                                        variant="outline"
                                        size="sm"
                                        icon={RefreshCw}
                                        disabled={loading}
                                        className="flex-1 md:flex-none"
                                   >
                                        <span className="hidden sm:inline">Actualizar</span>
                                   </Button>
                                   <Button
                                        onClick={handleOpenCreateCalendar}
                                        variant="primary"
                                        size="sm"
                                        icon={Plus}
                                        className="flex-1 md:flex-none"
                                   >
                                        <span className="hidden sm:inline">Nuevo</span>
                                        <span className="sm:hidden">Crear</span>
                                   </Button>
                              </div>
                         </div>

                         {/* Filtros */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <SearchInput
                                   value={calendarSearchTerm}
                                   onChange={setCalendarSearchTerm}
                                   placeholder="Buscar por año académico..."
                              />
                              <div className="md:col-span-2 flex flex-wrap gap-2">
                                   <Button
                                        variant={calendarStatusFilter === "ACTIVE" ? "primary" : "outline"}
                                        size="sm"
                                        onClick={() => setCalendarStatusFilter("ACTIVE")}
                                   >
                                        Activos
                                   </Button>
                                   <Button
                                        variant={calendarStatusFilter === "INACTIVE" ? "primary" : "outline"}
                                        size="sm"
                                        onClick={() => setCalendarStatusFilter("INACTIVE")}
                                   >
                                        Inactivos
                                   </Button>
                                   <Button
                                        variant={calendarStatusFilter === "ALL" ? "primary" : "outline"}
                                        size="sm"
                                        onClick={() => setCalendarStatusFilter("ALL")}
                                   >
                                        Todos
                                   </Button>
                              </div>
                         </div>
                    </motion.div>

                    {/* Lista de calendarios */}
                    {loading ? (
                         <div className="flex justify-center items-center py-20">
                              <Spinner />
                         </div>
                    ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredCalendars.length === 0 ? (
                                   <div className="col-span-full bg-white rounded-xl border border-gray-100 p-12 text-center">
                                        <CalendarRange className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-400">No se encontraron calendarios</p>
                                        <p className="text-gray-400 text-sm mt-2">Crea tu primer calendario académico</p>
                                   </div>
                              ) : (
                                   filteredCalendars.map((calendar) => (
                                        <motion.div
                                             key={calendar.id}
                                             initial={{ opacity: 0, y: 20 }}
                                             animate={{ opacity: 1, y: 0 }}
                                             className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
                                        >
                                             <div className="p-6">
                                                  <div className="flex items-start justify-between mb-4">
                                                       <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                                                 <CalendarRange className="w-6 h-6 text-primary-600" />
                                                            </div>
                                                            <div>
                                                                 <h3 className="font-bold text-lg text-gray-900">
                                                                      Año {calendar.academicYear}
                                                                 </h3>
                                                                 {calendar.academicYearName && (
                                                                      <p className="text-sm text-gray-700 font-medium">
                                                                           {calendar.academicYearName}
                                                                      </p>
                                                                 )}
                                                                 <p className="text-xs text-gray-500">
                                                                      {getCalendarDuration(calendar)} días
                                                                 </p>
                                                            </div>
                                                       </div>
                                                       {isCalendarActiveStatus(calendar) ? (
                                                            <Badge color="green" size="sm">Activo</Badge>
                                                       ) : (
                                                            <Badge color="red" size="sm">Inactivo</Badge>
                                                       )}
                                                  </div>

                                                  <div className="space-y-2 mb-4">
                                                       <div className="flex items-center text-sm text-gray-600">
                                                            <span className="font-medium mr-2">Inicio:</span>
                                                            {formatDateShortMonth(calendar.startDate)}
                                                       </div>
                                                       <div className="flex items-center text-sm text-gray-600">
                                                            <span className="font-medium mr-2">Fin:</span>
                                                            {formatDateShortMonth(calendar.endDate)}
                                                       </div>
                                                  </div>

                                                  <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                                                       <button
                                                            onClick={() => handleSelectCalendar(calendar)}
                                                            className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                                                       >
                                                            <Eye className="w-4 h-4" />
                                                            Ver Eventos
                                                       </button>
                                                       <div className="flex gap-2">
                                                            <button
                                                                 onClick={() => handleOpenEditCalendar(calendar)}
                                                                 disabled={isCalendarInactive(calendar)}
                                                                 className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                 <Edit className="w-4 h-4" />
                                                                 Editar
                                                            </button>
                                                            {isCalendarActiveStatus(calendar) ? (
                                                                 <button
                                                                      onClick={() => handleDeleteCalendar(calendar)}
                                                                      className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                                                 >
                                                                      <Trash2 className="w-4 h-4" />
                                                                      Eliminar
                                                                 </button>
                                                            ) : (
                                                                 <button
                                                                      onClick={() => handleReactivateCalendar(calendar)}
                                                                      className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                                                 >
                                                                      <RotateCcw className="w-4 h-4" />
                                                                      Reactivar
                                                                 </button>
                                                            )}
                                                       </div>
                                                  </div>
                                             </div>
                                        </motion.div>
                                   ))
                              )}
                         </div>
                    )}

                    {/* Modal Crear/Editar Calendario */}
                    <Modal
                         isOpen={calendarModalOpen}
                         onClose={() => setCalendarModalOpen(false)}
                         title={editingCalendarId ? "Editar Calendario Académico" : "Nuevo Calendario Académico"}
                         size="md"
                    >
                         <form onSubmit={handleSubmitCalendar} className="space-y-4">
                              <Input
                                   label="Año Académico *"
                                   type="number"
                                   value={calendarFormData.academicYear}
                                   onChange={(e) => setCalendarFormData({ ...calendarFormData, academicYear: e.target.value })}
                                   min={2020}
                                   max={2050}
                                   required
                              />
                              <Input
                                   label="Nombre del Año (ej: Año de la Esperanza)"
                                   type="text"
                                   value={calendarFormData.academicYearName}
                                   onChange={(e) => setCalendarFormData({ ...calendarFormData, academicYearName: e.target.value })}
                                   placeholder="Nombre o tema del año académico"
                              />
                              <Input
                                   label="Fecha de Inicio *"
                                   type="date"
                                   value={calendarFormData.startDate}
                                   onChange={(e) => setCalendarFormData({ ...calendarFormData, startDate: e.target.value })}
                                   required
                              />
                              <Input
                                   label="Fecha de Fin *"
                                   type="date"
                                   value={calendarFormData.endDate}
                                   onChange={(e) => setCalendarFormData({ ...calendarFormData, endDate: e.target.value })}
                                   required
                              />

                              {/* Checkbox para agregar fechas cívicas peruanas */}
                              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                                   editingCalendarId && calendarFormData.includeCivicDates
                                        ? "bg-green-50 border-green-200"
                                        : "bg-blue-50 border-blue-200"
                              }`}>
                                   <input
                                        type="checkbox"
                                        id="includeCivicDates"
                                        checked={calendarFormData.includeCivicDates || false}
                                        onChange={(e) => setCalendarFormData({ ...calendarFormData, includeCivicDates: e.target.checked })}
                                        disabled={editingCalendarId && calendarFormData.includeCivicDates}
                                        className="w-4 h-4 text-blue-600 rounded cursor-pointer disabled:cursor-not-allowed"
                                   />
                                   <label htmlFor="includeCivicDates" className={`flex-1 text-sm font-medium ${
                                        editingCalendarId && calendarFormData.includeCivicDates
                                             ? "text-green-700 cursor-default"
                                             : "text-gray-700 cursor-pointer"
                                   }`}>
                                        {editingCalendarId && calendarFormData.includeCivicDates
                                             ? "✓ Fechas cívicas peruanas incluidas"
                                             : editingCalendarId
                                                  ? "Agregar fechas cívicas peruanas que falten"
                                                  : "Incluir fechas cívicas peruanas automáticamente"
                                        }
                                        <p className={`text-xs font-normal mt-1 ${
                                             editingCalendarId && calendarFormData.includeCivicDates
                                                  ? "text-green-600"
                                                  : "text-gray-500"
                                        }`}>
                                             {editingCalendarId && calendarFormData.includeCivicDates
                                                  ? "Este calendario contiene las 10 fechas cívicas peruanas"
                                                  : editingCalendarId
                                                       ? "Se agregarán las 10 fechas cívicas que no existan aún en este calendario"
                                                       : "Se agregarán 10 fechas cívicas (Año Nuevo, Navidad, Independencia, etc.)"
                                             }
                                        </p>
                                   </label>
                              </div>

                              <div className="flex gap-2 pt-4">
                                   <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCalendarModalOpen(false)}
                                        disabled={saving}
                                        className="flex-1"
                                   >
                                        Cancelar
                                   </Button>
                                   <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={saving}
                                        className="flex-1"
                                   >
                                        {saving ? "Guardando..." : editingCalendarId ? "Actualizar Calendario" : "Crear Calendario"}
                                   </Button>
                              </div>
                         </form>
                    </Modal>
               </div>
          );
     }

     // ============================================
     // RENDER: VISTA DE EVENTOS (con calendario seleccionado)
     // ============================================
     return (
          <div>
               {/* Header con breadcrumb */}
               <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
               >
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-4 overflow-x-auto">
                         <button
                              onClick={handleBackToCalendars}
                              className="flex items-center gap-1 hover:text-primary-600 transition-colors whitespace-nowrap flex-shrink-0"
                         >
                              <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              Calendarios
                         </button>
                         <span>/</span>
                         <span className="text-gray-800 font-medium whitespace-nowrap">
                              {selectedCalendar.academicYearName 
                                   ? `${selectedCalendar.academicYear} - ${selectedCalendar.academicYearName}`
                                   : `Calendario ${selectedCalendar.academicYear}`
                              }
                         </span>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                         <div className="min-w-0 flex-1">
                              <h1 className="text-lg md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                                   <Calendar className="w-5 h-5 md:w-7 md:h-7 text-primary-600 flex-shrink-0" />
                                   <span className="truncate">Eventos del Calendario {selectedCalendar.academicYear}</span>
                              </h1>
                              <p className="text-gray-500 text-xs md:text-sm mt-1">
                                   {formatDateShortMonth(selectedCalendar.startDate)} - {formatDateShortMonth(selectedCalendar.endDate)}
                              </p>
                         </div>
                         <div className="flex gap-2 w-full md:w-auto">
                              <Button
                                   onClick={loadEvents}
                                   variant="outline"
                                   size="sm"
                                   icon={RefreshCw}
                                   disabled={loading}
                                   className="flex-1 md:flex-none"
                              >
                                   <span className="hidden sm:inline">Actualizar</span>
                              </Button>
                              <Button
                                   onClick={handleOpenCreate}
                                   variant="primary"
                                   size="sm"
                                   icon={Plus}
                                   className="flex-1 md:flex-none"
                              >
                                   <span className="hidden sm:inline">Nuevo</span>
                                   <span className="sm:hidden">Crear</span>
                              </Button>
                         </div>
                    </div>

                    {/* Filtros */}
                    <div className="space-y-3 mb-4">
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <SearchInput
                                   value={searchTerm}
                                   onChange={setSearchTerm}
                                   placeholder="Buscar eventos..."
                              />
                              <Select
                                   value={typeFilter}
                                   onChange={(e) => setTypeFilter(e.target.value)}
                                   options={[
                                        { value: "", label: "Todos los tipos" },
                                        ...EVENT_TYPE_OPTIONS
                                   ]}
                              />
                              <div className="flex flex-wrap gap-2 items-center">
                                   <Button
                                        onClick={() => setStatusFilter("ACTIVE")}
                                        variant={statusFilter === "ACTIVE" ? "primary" : "outline"}
                                        size="sm"
                                   >
                                        Activos
                                   </Button>
                                   <Button
                                        onClick={() => setStatusFilter("INACTIVE")}
                                        variant={statusFilter === "INACTIVE" ? "primary" : "outline"}
                                        size="sm"
                                   >
                                        Inactivos
                                   </Button>
                                   <Button
                                        onClick={() => setStatusFilter("ALL")}
                                        variant={statusFilter === "ALL" ? "primary" : "outline"}
                                        size="sm"
                                   >
                                        Todos
                                   </Button>
                              </div>
                         </div>
                         
                         {/* Controles de vista */}
                         <div className="flex gap-2 justify-end">
                              <Button
                                   onClick={() => handleGenerateReport("csv")}
                                   variant="outline"
                                   size="sm"
                                   icon={FileDown}
                                   loading={reporting}
                                   disabled={reporting || !filteredEvents.length}
                              >
                                   <span className="hidden md:inline">Reporte CSV</span>
                                   <span className="md:hidden">CSV</span>
                              </Button>
                              <Button
                                   onClick={() => handleGenerateReport("pdf")}
                                   variant="outline"
                                   size="sm"
                                   icon={FileDown}
                                   loading={reporting}
                                   disabled={reporting || !filteredEvents.length}
                              >
                                   <span className="hidden md:inline">Reporte PDF</span>
                                   <span className="md:hidden">PDF</span>
                              </Button>
                              <Button
                                   onClick={() => setViewMode("list")}
                                   variant={viewMode === "list" ? "primary" : "outline"}
                                   size="sm"
                                   icon={List}
                              >
                                   <span className="hidden md:inline">Lista</span>
                              </Button>
                              <Button
                                   onClick={() => setViewMode("calendar")}
                                   variant={viewMode === "calendar" ? "primary" : "outline"}
                                   size="sm"
                                   icon={CalendarDays}
                              >
                                   <span className="hidden md:inline">Calendario</span>
                              </Button>
                              <Button
                                   onClick={() => setViewMode("year-cards")}
                                   variant={viewMode === "year-cards" ? "primary" : "outline"}
                                   size="sm"
                                   icon={LayoutGrid}
                              >
                                   <span className="hidden md:inline">Cards</span>
                              </Button>
                         </div>
                    </div>
               </motion.div>

               {/* Contenido según vista */}
               {loading ? (
                    <div className="flex justify-center items-center py-20">
                         <Spinner />
                    </div>
               ) : viewMode === "calendar" ? (
                    <CalendarView 
                         events={filteredEvents}
                         onEventClick={handleOpenView}
                    />
               ) : viewMode === "year-cards" ? (
                    <YearCardsView 
                         events={filteredEvents}
                         onEventClick={handleOpenView}
                    />
               ) : (
                    /* Vista de lista */
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                         <div className="overflow-x-auto">
                              <table className="w-full">
                                   <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Evento
                                             </th>
                                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Tipo
                                             </th>
                                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Fechas
                                             </th>
                                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Estado
                                             </th>
                                             <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                  Acciones
                                             </th>
                                        </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-200">
                                        {filteredEvents.length === 0 ? (
                                             <tr>
                                                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                                       No se encontraron eventos para este calendario
                                                  </td>
                                             </tr>
                                        ) : (
                                             filteredEvents.map((event) => (
                                                  <tr key={event.id} className="hover:bg-gray-50">
                                                       <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                 <Calendar className="w-5 h-5 text-primary-500" />
                                                                 <div>
                                                                      <p className="font-medium text-gray-900">{event.title}</p>
                                                                      {event.description && (
                                                                           <p className="text-sm text-gray-500 line-clamp-1">
                                                                                {event.description}
                                                                           </p>
                                                                      )}
                                                                 </div>
                                                            </div>
                                                       </td>
                                                       <td className="px-6 py-4">
                                                            <Badge color={getTypeBadgeColor(event.eventType)} size="sm">
                                                                 {EVENT_TYPE_LABELS[event.eventType]}
                                                            </Badge>
                                                       </td>
                                                       <td className="px-6 py-4">
                                                            <div className="text-sm">
                                                                 <p className="text-gray-900">{formatDateShortMonth(event.startDate)}</p>
                                                                 {event.endDate && event.endDate !== event.startDate && (
                                                                      <p className="text-gray-500">{formatDateShortMonth(event.endDate)}</p>
                                                                 )}
                                                            </div>
                                                       </td>
                                                       <td className="px-6 py-4">
                                                            <Badge 
                                                                 color={event.status === "ACTIVE" ? "green" : "gray"} 
                                                                 size="sm"
                                                            >
                                                                 {EVENT_STATUS_LABELS[event.status]}
                                                            </Badge>
                                                       </td>
                                                       <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                 <button
                                                                      onClick={() => handleOpenView(event)}
                                                                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                                                      title="Ver detalles"
                                                                 >
                                                                      <Eye className="w-4 h-4" />
                                                                 </button>
                                                                 {event.status === "ACTIVE" ? (
                                                                      <>
                                                                           <button
                                                                                onClick={() => handleOpenEdit(event)}
                                                                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                                                title="Editar"
                                                                           >
                                                                                <Edit className="w-4 h-4" />
                                                                           </button>
                                                                           <button
                                                                                onClick={() => handleDelete(event)}
                                                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                                                title="Eliminar"
                                                                           >
                                                                                <Trash2 className="w-4 h-4" />
                                                                           </button>
                                                                      </>
                                                                 ) : (
                                                                      <button
                                                                           onClick={() => handleRestore(event)}
                                                                           className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                                                           title="Restaurar"
                                                                      >
                                                                           <RotateCcw className="w-4 h-4" />
                                                                      </button>
                                                                 )}
                                                            </div>
                                                       </td>
                                                  </tr>
                                             ))
                                        )}
                                   </tbody>
                              </table>
                         </div>
                    </div>
               )}

               {/* Modal Crear/Editar Evento */}
               <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={selectedEvent ? "Editar Evento" : "Nuevo Evento"}
                    size="lg"
               >
                    <form onSubmit={handleSubmit} className="space-y-4">
                         <Input
                              label="Título del evento *"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              placeholder="Ej: Día de la Independencia"
                              required
                         />
                         <div className="grid grid-cols-2 gap-4">
                              <Input
                                   label="Fecha de inicio *"
                                   type="date"
                                   value={formData.startDate}
                                   onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                   required
                              />
                              <Input
                                   label="Fecha de fin"
                                   type="date"
                                   value={formData.endDate}
                                   onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                              />
                         </div>
                         <Select
                              label="Tipo de evento *"
                              value={formData.eventType}
                              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                              options={EVENT_TYPE_OPTIONS}
                              required
                         />
                         <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Descripción</label>
                              <textarea
                                   value={formData.description}
                                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                   rows="3"
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                   placeholder="Descripción del evento..."
                              />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                   <input
                                        type="checkbox"
                                        checked={formData.isHoliday}
                                        onChange={(e) => setFormData({ ...formData, isHoliday: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                   />
                                   <span className="text-sm text-gray-700">Es feriado</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                   <input
                                        type="checkbox"
                                        checked={formData.affectsClasses}
                                        onChange={(e) => setFormData({ ...formData, affectsClasses: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                   />
                                   <span className="text-sm text-gray-700">Afecta clases</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                   <input
                                        type="checkbox"
                                        checked={formData.isNational}
                                        onChange={(e) => setFormData({ ...formData, isNational: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                   />
                                   <span className="text-sm text-gray-700">Nacional</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                   <input
                                        type="checkbox"
                                        checked={formData.isRecurring}
                                        onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                   />
                                   <span className="text-sm text-gray-700">Recurrente</span>
                              </label>
                         </div>

                         <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <p className="text-sm text-amber-800">
                                   <strong>Nota:</strong> Este evento se creará para el año {selectedCalendar.academicYear}.
                                   Las fechas deben estar dentro de este periodo académico.
                              </p>
                         </div>

                         <div className="flex gap-2 pt-4">
                              <Button
                                   type="button"
                                   variant="outline"
                                   onClick={() => setModalOpen(false)}
                                   disabled={saving}
                                   className="flex-1"
                              >
                                   Cancelar
                              </Button>
                              <Button
                                   type="submit"
                                   variant="primary"
                                   disabled={saving}
                                   className="flex-1"
                              >
                                   {saving ? "Guardando..." : selectedEvent ? "Actualizar" : "Crear Evento"}
                              </Button>
                         </div>
                    </form>
               </Modal>

               {/* Modal Ver Evento */}
               <Modal
                    isOpen={viewModalOpen}
                    onClose={() => setViewModalOpen(false)}
                    title="Detalles del Evento"
                    size="md"
               >
                    {selectedEvent && (
                         <div className="space-y-4">
                              <div>
                                   <h3 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h3>
                                   <Badge color={getTypeBadgeColor(selectedEvent.eventType)} size="sm" className="mt-2">
                                        {EVENT_TYPE_LABELS[selectedEvent.eventType]}
                                   </Badge>
                              </div>
                              
                              {selectedEvent.description && (
                                   <div>
                                        <p className="text-sm font-medium text-gray-700">Descripción</p>
                                        <p className="text-gray-600 mt-1">{selectedEvent.description}</p>
                                   </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                   <div>
                                        <p className="text-sm font-medium text-gray-700">Fecha de inicio</p>
                                        <p className="text-gray-900">{formatDateShortMonth(selectedEvent.startDate)}</p>
                                   </div>
                                   {selectedEvent.endDate && (
                                        <div>
                                             <p className="text-sm font-medium text-gray-700">Fecha de fin</p>
                                             <p className="text-gray-900">{formatDateShortMonth(selectedEvent.endDate)}</p>
                                        </div>
                                   )}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                   {selectedEvent.isHoliday && <Badge color="red" size="sm">Feriado</Badge>}
                                   {selectedEvent.isNational && <Badge color="blue" size="sm">Nacional</Badge>}
                                   {selectedEvent.affectsClasses && <Badge color="orange" size="sm">Afecta Clases</Badge>}
                                   {selectedEvent.isRecurring && <Badge color="purple" size="sm">Recurrente</Badge>}
                              </div>

                              <div className="pt-4 border-t">
                                   <p className="text-xs text-gray-500">
                                        Estado: {EVENT_STATUS_LABELS[selectedEvent.status]}
                                   </p>
                              </div>
                         </div>
                    )}
               </Modal>
          </div>
     );
}
