import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <ShieldAlert size={56} className="mx-auto mb-4 text-red-400" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
        <p className="text-sm text-gray-500 mb-6">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition"
        >
          ← Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
