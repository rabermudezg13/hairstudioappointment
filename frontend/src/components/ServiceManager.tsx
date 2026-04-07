"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { PencilIcon, TrashIcon, PlusIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { servicesApi, Service, ServiceCreate } from "@/lib/api";

type FormValues = {
  name: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
};

function ServiceRow({
  service,
  onEdit,
  onDelete,
}: {
  service: Service;
  onEdit: (s: Service) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 hover:shadow-md transition">
      <div className="flex items-center gap-4">
        <div
          className={`w-3 h-3 rounded-full ${service.is_active ? "bg-green-400" : "bg-gray-300"}`}
          title={service.is_active ? "Activo" : "Inactivo"}
        />
        <div>
          <p className="font-semibold text-gray-800">{service.name}</p>
          <p className="text-sm text-gray-500">{service.duration_minutes} minutos</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-pink-600">${service.price.toFixed(2)}</span>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(service)}
            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(service.id)}
            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ServiceFormModalProps {
  service?: Service | null;
  onClose: () => void;
}

function ServiceFormModal({ service, onClose }: ServiceFormModalProps) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: service
      ? {
          name: service.name,
          duration_minutes: service.duration_minutes,
          price: service.price,
          is_active: service.is_active,
        }
      : { name: "", duration_minutes: 60, price: 0, is_active: true },
  });

  const createMutation = useMutation({
    mutationFn: (data: ServiceCreate) => servicesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Servicio creado");
      onClose();
    },
    onError: () => toast.error("Error al crear el servicio"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ServiceCreate>) => servicesApi.update(service!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Servicio actualizado");
      onClose();
    },
    onError: () => toast.error("Error al actualizar el servicio"),
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      duration_minutes: Number(values.duration_minutes),
      price: Number(values.price),
    };
    service ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800">
            {service ? "Editar servicio" : "Nuevo servicio"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("name", { required: "El nombre es requerido" })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración (min) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                {...register("duration_minutes", { required: true, min: 1 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("price", { required: true, min: 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("is_active")} className="accent-pink-500 w-4 h-4" />
            <span className="text-sm text-gray-700">Activo</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg py-2 text-sm font-medium hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
            >
              {isLoading ? "Guardando…" : service ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServiceManager() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Service | null | undefined>(undefined);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => servicesApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => servicesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Servicio eliminado");
    },
    onError: () => toast.error("Error al eliminar el servicio"),
  });

  const handleDelete = (id: number) => {
    if (confirm("¿Estás segura de que deseas eliminar este servicio?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Servicios</h2>
          <p className="text-sm text-gray-500 mt-1">{services.length} servicios en total</p>
        </div>
        <button
          onClick={() => setEditing(null)}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 transition shadow-md"
        >
          <PlusIcon className="w-4 h-4" />
          Nuevo servicio
        </button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-5xl block mb-3">✂️</span>
          <p className="text-lg">No hay servicios. ¡Agrega el primero!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <ServiceRow
              key={s.id}
              service={s}
              onEdit={(svc) => setEditing(svc)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {editing !== undefined && (
        <ServiceFormModal service={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}
