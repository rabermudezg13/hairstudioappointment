"use client";

import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, parseISO, isToday } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { appointmentsApi, Appointment, AppointmentStatus } from "@/lib/api";
import Link from "next/link";

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string }> = {
  scheduled: { label: "Programada", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Completada", className: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada", className: "bg-red-100 text-red-700" },
  no_show: { label: "No se presentó", className: "bg-yellow-100 text-yellow-700" },
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function TodayAppointmentCard({ appointment }: { appointment: Appointment }) {
  const statusCfg = STATUS_CONFIG[appointment.status];
  const dt = parseISO(appointment.appointment_date);
  return (
    <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3">
      <div className="text-center min-w-[48px]">
        <p className="text-lg font-bold text-pink-600">{format(dt, "HH:mm")}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{appointment.client_name}</p>
        <p className="text-sm text-gray-500 truncate">
          {appointment.service?.name} · {appointment.client_phone}
        </p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusCfg.className}`}>
        {statusCfg.label}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: allAppointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => appointmentsApi.list(),
  });

  const { data: todayAppointments = [] } = useQuery({
    queryKey: ["appointments", "today", today],
    queryFn: () => appointmentsApi.list({ date: today }),
  });

  const { data: upcomingAppointments = [] } = useQuery({
    queryKey: ["appointments", "upcoming"],
    queryFn: () => appointmentsApi.list({ upcoming: true }),
  });

  const completedThisWeek = allAppointments.filter((a) => {
    const dt = parseISO(a.appointment_date);
    const now = new Date();
    return (
      a.status === "completed" &&
      dt >= startOfWeek(now, { weekStartsOn: 1 }) &&
      dt <= endOfWeek(now, { weekStartsOn: 1 })
    );
  }).length;

  const uniqueClients = new Set(allAppointments.map((a) => a.client_phone)).size;

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1 capitalize">
          {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Citas hoy"
          value={todayAppointments.length}
          icon={CalendarDaysIcon}
          color="bg-pink-100 text-pink-600"
        />
        <StatCard
          label="Próximas citas"
          value={upcomingAppointments.length}
          icon={ClockIcon}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          label="Completadas esta semana"
          value={completedThisWeek}
          icon={CheckBadgeIcon}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          label="Clientes únicos"
          value={uniqueClients}
          icon={UserGroupIcon}
          color="bg-blue-100 text-blue-600"
        />
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800">Citas de hoy</h2>
          <Link
            href="/appointments"
            className="text-sm text-pink-600 font-medium hover:text-pink-700 transition"
          >
            Ver todas →
          </Link>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <span className="text-4xl block mb-2">☀️</span>
            <p>No hay citas programadas para hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((a) => (
              <TodayAppointmentCard key={a.id} appointment={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
