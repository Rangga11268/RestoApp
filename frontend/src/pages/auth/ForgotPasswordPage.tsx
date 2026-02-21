import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Mail, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import AuthLayout from "@/components/auth/AuthLayout";

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
      <AuthLayout>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 text-3xl mb-5">
            📬
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Email terkirim!
          </h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Kami mengirimkan link reset password ke email Anda.
            <br />
            Cek folder <strong>Spam</strong> jika tidak muncul.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-semibold"
          >
            ← Kembali ke login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Mobile brand */}
      <div className="flex items-center gap-2 mb-8 lg:hidden">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <span className="text-sm">🍽</span>
        </div>
        <span className="font-bold text-gray-900 text-lg">RestoApp</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Lupa password?</h1>
      <p className="text-sm text-gray-500 mb-7 leading-relaxed">
        Masukkan email Anda dan kami akan kirimkan link untuk reset password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700 flex items-start gap-2">
            <span className="flex-shrink-0 mt-px">⚠</span>
            <span>{serverError}</span>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              {...register("email")}
              type="email"
              placeholder="email@domain.com"
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition placeholder:text-gray-400"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition mt-1"
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {isSubmitting ? "Mengirim..." : "Kirim Link Reset"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        <Link
          to="/login"
          className="text-orange-500 hover:text-orange-600 font-semibold"
        >
          ← Kembali ke login
        </Link>
      </p>
    </AuthLayout>
  );
}
