"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ChatBubbleLeftEllipsisIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { smsApi, BulkSMSResponse } from "@/lib/api";

export default function SMSPanel() {
  const [lastResult, setLastResult] = useState<BulkSMSResponse | null>(null);

  const bulkMutation = useMutation({
    mutationFn: smsApi.sendBulkReminders,
    onSuccess: (data) => {
      setLastResult(data);
      if (data.sent > 0) {
        toast.success(`${data.sent} recordatorio(s) enviado(s)`);
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} recordatorio(s) fallaron`);
      }
      if (data.sent === 0 && data.failed === 0) {
        toast("No hay citas programadas para mañana", { icon: "ℹ️" });
      }
    },
    onError: () => toast.error("Error al enviar recordatorios"),
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Recordatorios SMS</h3>
          <p className="text-sm text-gray-500">Enviar recordatorio a todas las citas de mañana</p>
        </div>
      </div>

      <button
        onClick={() => bulkMutation.mutate()}
        disabled={bulkMutation.isPending}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
        {bulkMutation.isPending ? "Enviando…" : "Enviar recordatorios de mañana"}
      </button>

      {lastResult && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{lastResult.sent}</p>
              <p className="text-xs text-green-700 font-medium">Enviados</p>
            </div>
            <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-500">{lastResult.failed}</p>
              <p className="text-xs text-red-600 font-medium">Fallaron</p>
            </div>
          </div>

          {lastResult.details.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lastResult.details.map((d) => (
                <div
                  key={d.appointment_id}
                  className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-gray-50"
                >
                  {d.success ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className="font-medium text-gray-700 truncate">{d.client_name}</span>
                  <span className="text-gray-400 truncate">{d.phone}</span>
                  {!d.success && (
                    <span className="text-red-400 text-xs truncate ml-auto">{d.message}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
