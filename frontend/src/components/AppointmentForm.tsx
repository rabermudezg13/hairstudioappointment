"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { servicesApi, Appointment, AppointmentCreate } from "@/lib/api";
import { format } from "date-fns";

interface Props {
  appointment?: Appointment | null;
  onSubmit: (data: AppointmentCreate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

type FormValues = {
  client_name: string;
  client_phone: string;
  service_id: number;
  date: string;
  time: string;
  notes: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
};

export default function AppointmentForm({ appointment, onSubmit, onCancel, isLoading }: Props) {
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => servicesApi.list(true),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  useEffect(() => {
    if (appointment) {
      const dt = new Date(appointment.appointment_date);
      reset({
        client_name: appointment.client_name,
        client_phone: appointment.client_phone,
        service_id: appointment.service_id,
        date: format(dt, "yyyy-MM-dd"),
        time: format(dt, "HH:mm"),
        notes: appointment.notes || "",
        status: appointment.status,
      });
    } else {
      reset({
        client_name: "",
        client_phone: "",
        service_id: services[0]?.id,
        date: format(new Date(), "yyyy-MM-dd"),
        time: "10:00",
        notes: "",
        status: "scheduled",
      });
    }
  }, [appointment, services, reset]);

  const handleFormSubmit = async (values: FormValues) => {
    const appointment_date = new Date(`${values.date}T${values.time}:00`).toISOString();
    await onSubmit({
      client_name: values.client_name,
      client_phone: values.client_phone,
      service_id: Number(values.service_id),
      appointment_date,
      notes: values.notes || undefined,
      status: values.status,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Client Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del cliente <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("client_name", { required: "El nombre es requerido" })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          placeholder="María García"
        />
        {errors.client_name && (
          <p className="text-red-500 text-xs mt-1">{errors.client_name.message}</p>
        )}
      </div>

      {/* Client Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          {...register("client_phone", { required: "El teléfono es requerido" })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          placeholder="+1 (555) 000-0000"
        />
        {errors.client_phone && (
          <p className="text-red-500 text-xs mt-1">{errors.client_phone.message}</p>
        )}
      </div>

      {/* Service */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Servicio <span className="text-red-500">*</span>
        </label>
        <select
          {...register("service_id", { required: "El servicio es requerido" })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
        >
          <option value="">Seleccionar servicio…</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.duration_minutes} min — ${s.price}
            </option>
          ))}
        </select>
        {errors.service_id && (
          <p className="text-red-500 text-xs mt-1">{errors.service_id.message}</p>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register("date", { required: "La fecha es requerida" })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          {errors.date && (
            <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hora <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            {...register("time", { required: "La hora es requerida" })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          {errors.time && (
            <p className="text-red-500 text-xs mt-1">{errors.time.message}</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <select
          {...register("status")}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
        >
          <option value="scheduled">Programada</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
          <option value="no_show">No se presentó</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
        <textarea
          {...register("notes")}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
          placeholder="Instrucciones especiales, preferencias del cliente…"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg py-2 text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50"
        >
          {isLoading ? "Guardando…" : appointment ? "Actualizar" : "Crear cita"}
        </button>
      </div>
    </form>
  );
}
