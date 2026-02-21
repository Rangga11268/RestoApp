import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import api from "@/lib/axios";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await api.post("/auth/forgot-password", data);
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setServerError(msg ?? "Terjadi kesalahan.");
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Email terkirim!
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Kami mengirimkan link reset password ke email Anda. Cek folder spam
            jika tidak muncul.
          </p>
          <Link
            to="/login"
            className="text-orange-500 hover:text-orange-600 text-sm font-medium"
          >
            Kembali ke halaman login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500 mb-4">
              <span className="text-white text-xl">🔑</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Lupa Password</h1>
            <p className="text-sm text-gray-500 mt-1">
              Masukkan email Anda dan kami akan kirimkan link reset password.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {serverError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="email@domain.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Link Reset"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link
              to="/login"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              ← Kembali ke login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
