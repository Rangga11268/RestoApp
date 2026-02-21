import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/axios";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Link tidak valid
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Link reset password tidak valid atau sudah kadaluarsa.
          </p>
          <Link
            to="/forgot-password"
            className="text-orange-500 hover:text-orange-600 text-sm font-medium"
          >
            Minta link baru
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
              <span className="text-white text-xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-sm text-gray-500 mt-1">
              Masukkan password baru Anda
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
                Password Baru
              </label>
              <input
                {...register("password")}
                type="password"
                placeholder="Min. 8 karakter"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Password
              </label>
              <input
                {...register("password_confirmation")}
                type="password"
                placeholder="Ulangi password baru"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
              />
              {errors.password_confirmation && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.password_confirmation.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition"
            >
              {isSubmitting ? "Menyimpan..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
