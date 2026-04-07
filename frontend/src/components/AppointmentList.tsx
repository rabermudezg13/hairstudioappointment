"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { Appointment, AppointmentStatus } from "@/lib/api";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  scheduled: { label: "Programada", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Completada", className: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada", className: "bg-red-100 text-red-700" },
  no_show: { label: "No se presentó", className: "bg-yellow-100 text-yellow-700" },
};

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (a: Appointment) => void;
  onDelete: (id: number) => void;
  onSendSMS: (id: number) => void;
}

function AppointmentCard({ appointment, onEdit, onDelete, onSendSMS }: AppointmentCardProps) {
  const statusCfg = STATUS_CONFIG[appointment.status];
  const dt = parseISO(appointment.appointment_date);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-800 truncate">{appointment.client_name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}
            >
              {statusCfg.label}
            </span>
            {appointment.sms_sent && (
              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" title="SMS enviado" />
            )}
          </div>
          <p className="text-sm text-gray-500">{appointment.client_phone}</p>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
            <span className="font-medium text-pink-600">
              {format(dt, "HH:mm")}
            </span>
            <span className="text-gray-400">·</span>
            <span>{appointment.service?.name || "—"}</span>
            {appointment.service && (
              <>
                <span className="text-gray-400">·</span>
                <span>{appointment.service.duration_minutes} min</span>
              </>
            )}
          </div>
          {appointment.notes && (
            <p className="text-xs text-gray-400 mt-1 italic truncate">{appointment.notes}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <button
            onClick={() => onSendSMS(appointment.id)}
            className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg transition"
            title="Enviar recordatorio SMS"
          >
            <ChatBubbleLeftIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(appointment)}
            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
            title="Editar"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(appointment.id)}
            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
            title="Eliminar"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  groups: Array<{ date: string; appointments: Appointment[] }>;
  onEdit: (a: Appointment) => void;
  onDelete: (id: number) => void;
  onSendSMS: (id: number) => void;
  emptyMessage?: string;
}

export default function AppointmentList({
  groups,
  onEdit,
  onDelete,
  onSendSMS,
  emptyMessage = "No hay citas",
}: Props) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <span className="text-5xl block mb-3">📅</span>
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const dateLabel = format(parseISO(group.date), "EEEE d 'de' MMMM yyyy", { locale: es });
        return (
          <div key={group.date}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 capitalize">
              {dateLabel}
              <span className="ml-2 text-pink-500">({group.appointments.length})</span>
            </h3>
            <div className="space-y-3">
              {group.appointments.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSendSMS={onSendSMS}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
