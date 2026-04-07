"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { PlusIcon, XMarkIcon, FunnelIcon } from "@heroicons/react/24/outline";
import {
  appointmentsApi,
  smsApi,
  Appointment,
  AppointmentCreate,
  AppointmentStatus,
  AppointmentsByDate,
} from "@/lib/api";
import AppointmentForm from "@/components/AppointmentForm";
import AppointmentList from "@/components/AppointmentList";
import SMSPanel from "@/components/SMSPanel";

type Tab = "upcoming" | "past" | "all";
type StatusFilter = "all" | AppointmentStatus;

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const queryParams = {
    upcoming: tab === "upcoming" ? true : undefined,
    past: tab === "past" ? true : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    date: dateFilter || undefined,
  };

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["appointments", "by-date", tab, statusFilter, dateFilter],
    queryFn: () =>
      appointmentsApi.byDate({
        upcoming: tab === "upcoming" ? true : undefined,
        past: tab === "past" ? true : undefined,
      }),
  });

  // Client-side filter by status + date after fetching
  const filteredGroups: AppointmentsByDate[] = groups
    .map((g) => ({
      ...g,
      appointments: g.appointments.filter((a) => {
        if (statusFilter !== "all" && a.status !== statusFilter) return false;
        if (dateFilter && !a.appointment_date.startsWith(dateFilter)) return false;
        return true;
      }),
    }))
    .filter((g) => g.appointments.length > 0);

  const createMutation = useMutation({
    mutationFn: (data: AppointmentCreate) => appointmentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Cita creada");
      setShowModal(false);
      setEditingAppt(null);
    },
    onError: () => toast.error("Error al crear la cita"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AppointmentCreate }) =>
      appointmentsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Cita actualizada");
      setShowModal(false);
      setEditingAppt(null);
    },
    onError: () => toast.error("Error al actualizar la cita"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => appointmentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Cita eliminada");
    },
    onError: () => toast.error("Error al eliminar la cita"),
  });

  const smsMutation = useMutation({
    mutationFn: (id: number) => smsApi.sendReminder(id),
    onSuccess: (data) => {
      if (data.success) {
        qc.invalidateQueries({ queryKey: ["appointments"] });
        toast.success("Recordatorio enviado");
      } else {
        toast.error(`Error SMS: ${data.message}`);
      }
    },
    onError: () => toast.error("Error al enviar SMS"),
  });

  const handleSubmit = async (data: AppointmentCreate) => {
    setIsSaving(true);
    try {
      if (editingAppt) {
        await updateMutation.mutateAsync({ id: editingAppt.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás segura de que deseas eliminar esta cita?")) {
      deleteMutation.mutate(id);
    }
  };

  const openEdit = (appt: Appointment) => {
    setEditingAppt(appt);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAppt(null);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "upcoming", label: "Próximas" },
    { key: "past", label: "Pasadas" },
    { key: "all", label: "Todas" },
  ];

  const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "Todos los estados" },
    { value: "scheduled", label: "Programada" },
    { value: "completed", label: "Completada" },
    { value: "cancelled", label: "Cancelada" },
    { value: "no_show", label: "No se presentó" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Citas</h1>
          <p className="text-gray-500 mt-1">Gestiona todas las citas del salón</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 transition shadow-md"
        >
          <PlusIcon className="w-5 h-5" />
          Nueva cita
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left column: filters + SMS panel */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vista</p>
            <div className="space-y-1">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    tab === key
                      ? "bg-pink-50 text-pink-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FunnelIcon className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtros</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Estado</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {(dateFilter || statusFilter !== "all") && (
                <button
                  onClick={() => { setDateFilter(""); setStatusFilter("all"); }}
                  className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* SMS Panel */}
          <SMSPanel />
        </div>

        {/* Right column: appointment list */}
        <div className="xl:col-span-3">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            </div>
          ) : (
            <AppointmentList
              groups={filteredGroups}
              onEdit={openEdit}
              onDelete={handleDelete}
              onSendSMS={(id) => smsMutation.mutate(id)}
              emptyMessage={
                tab === "upcoming"
                  ? "No hay citas próximas"
                  : tab === "past"
                  ? "No hay citas pasadas"
                  : "No hay citas"
              }
            />
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                {editingAppt ? "Editar cita" : "Nueva cita"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <AppointmentForm
              appointment={editingAppt}
              onSubmit={handleSubmit}
              onCancel={closeModal}
              isLoading={isSaving}
            />
          </div>
        </div>
      )}
    </div>
  );
}
