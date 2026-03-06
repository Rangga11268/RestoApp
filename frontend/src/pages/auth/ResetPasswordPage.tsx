import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LockKey, Eye, EyeClosed, CircleNotch } from "@phosphor-icons/react";
import api from "@/lib/axios";
import AuthLayout from "@/components/auth/AuthLayout";

const schema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter"),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Konfirmasi password tidak cocok",
    path: ["password_confirmation"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [serverError, setServerError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await api.post("/auth/reset-password", { ...data, token, email });
      navigate("/login?reset=1");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setServerError(msg ?? "Link reset tidak valid atau sudah kadaluarsa.");
    }
  };

  if (!token || !email) {
    return (
      <AuthLayout>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 text-3xl mb-5">
            ❌
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Link tidak valid
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Link reset password tidak valid atau sudah kadaluarsa.
          </p>
          <Link
            to="/forgot-password"
            className="text-sm text-orange-500 hover:text-orange-600 font-semibold"
          >
            Minta link baru
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

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Buat password baru
      </h1>
      <p className="text-sm text-gray-500 mb-7">
        Masukkan password baru untuk akun Anda.
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
            Password Baru
          </label>
          <div className="relative">
            <LockKey
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              {...register("password")}
              type={showPwd ? "text" : "password"}
              placeholder="Min. 8 karakter"
              className="w-full rounded-lg border border-gray-300 pl-9 pr-10 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              {showPwd ? <EyeClosed size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Konfirmasi Password
          </label>
          <div className="relative">
            <LockKey
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              {...register("password_confirmation")}
              type={showConfirm ? "text" : "password"}
              placeholder="Ulangi password baru"
              className="w-full rounded-lg border border-gray-300 pl-9 pr-10 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              {showConfirm ? <EyeClosed size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password_confirmation && (
            <p className="text-xs text-red-500 mt-1">
              {errors.password_confirmation.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition mt-1"
        >
          {isSubmitting && <CircleNotch size={15} className="animate-spin" />}
          {isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
        </button>
      </form>
    </AuthLayout>
  );
}
