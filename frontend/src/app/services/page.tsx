import ServiceManager from "@/components/ServiceManager";

export default function ServicesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Servicios</h1>
        <p className="text-gray-500 mt-1">Administra los servicios del salón</p>
      </div>
      <ServiceManager />
    </div>
  );
}
