import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Types ──────────────────────────────────────────────────────────────────

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: number;
  client_name: string;
  client_phone: string;
  service_id: number;
  appointment_date: string;
  notes?: string;
  status: AppointmentStatus;
  sms_sent: boolean;
  created_at: string;
  service?: Service;
}

export interface AppointmentsByDate {
  date: string;
  appointments: Appointment[];
}

export interface AppointmentCreate {
  client_name: string;
  client_phone: string;
  service_id: number;
  appointment_date: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface AppointmentUpdate extends Partial<AppointmentCreate> {
  sms_sent?: boolean;
}

export interface ServiceCreate {
  name: string;
  duration_minutes: number;
  price: number;
  is_active?: boolean;
}

export interface BulkSMSResponse {
  sent: number;
  failed: number;
  details: Array<{
    appointment_id: number;
    client_name: string;
    phone: string;
    success: boolean;
    message: string;
    sid?: string;
  }>;
}

// ── Service API ────────────────────────────────────────────────────────────

export const servicesApi = {
  list: (activeOnly = false) =>
    api.get<Service[]>("/api/services", { params: { active_only: activeOnly } }).then((r) => r.data),

  get: (id: number) => api.get<Service>(`/api/services/${id}`).then((r) => r.data),

  create: (data: ServiceCreate) => api.post<Service>("/api/services", data).then((r) => r.data),

  update: (id: number, data: Partial<ServiceCreate>) =>
    api.put<Service>(`/api/services/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/api/services/${id}`),
};

// ── Appointment API ────────────────────────────────────────────────────────

export const appointmentsApi = {
  list: (params?: {
    date?: string;
    status?: AppointmentStatus;
    upcoming?: boolean;
    past?: boolean;
  }) => api.get<Appointment[]>("/api/appointments", { params }).then((r) => r.data),

  byDate: (params?: { upcoming?: boolean; past?: boolean }) =>
    api.get<AppointmentsByDate[]>("/api/appointments/by-date", { params }).then((r) => r.data),

  get: (id: number) => api.get<Appointment>(`/api/appointments/${id}`).then((r) => r.data),

  create: (data: AppointmentCreate) =>
    api.post<Appointment>("/api/appointments", data).then((r) => r.data),

  update: (id: number, data: AppointmentUpdate) =>
    api.put<Appointment>(`/api/appointments/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/api/appointments/${id}`),
};

// ── SMS API ────────────────────────────────────────────────────────────────

export const smsApi = {
  sendReminder: (appointmentId: number) =>
    api
      .post<{ success: boolean; message: string; sid?: string }>(
        `/api/sms/send-reminder/${appointmentId}`
      )
      .then((r) => r.data),

  sendBulkReminders: () =>
    api.post<BulkSMSResponse>("/api/sms/send-bulk-reminders").then((r) => r.data),
};
