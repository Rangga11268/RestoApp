import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EnvelopeSimple, LockKey, Eye, EyeClosed, CircleNotch } from "@phosphor-icons/react";
import { useAuthStore } from "@/stores/authStore";
import AuthLayout from "@/components/auth/AuthLayout";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password, rememberMe);
      navigate("/dashboard");
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string } } })
        ?.response?.data;
      setError("root", { message: res?.message ?? "Login gagal, coba lagi." });
    }
  };

  return (
    <AuthLayout>
      {/* Mobile brand */}
      <div className="flex items-center gap-2 mb-8 lg:hidden">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <span className="text-sm">🍽</span>
        </div>
        <span className="font-bold text-gray-900 text-lg">RestoApp</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Selamat datang</h1>
      <p className="text-sm text-gray-500 mb-7">Masuk ke akun RestoApp Anda</p>

      {searchParams.get("reset") === "1" && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 mb-5 flex items-start gap-2">
          <span className="flex-shrink-0 font-bold">✓</span>
          <span>
            Password berhasil direset. Silakan login dengan password baru.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700 flex items-start gap-2">
            <span className="flex-shrink-0 mt-px">⚠</span>
            <span>{errors.root.message}</span>
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <div className="relative">
            <EnvelopeSimple
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="email@domain.com"
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition placeholder:text-gray-400"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <LockKey
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              {...register("password")}
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 pl-9 pr-10 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              tabIndex={-1}
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

        {/* Remember me + submit */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div
              onClick={() => setRememberMe((v) => !v)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                rememberMe
                  ? "bg-orange-500 border-orange-500"
                  : "border-gray-300 bg-white group-hover:border-orange-400"
              }`}
            >
              {rememberMe && (
                <svg
                  viewBox="0 0 10 8"
                  className="w-2.5 h-2.5 fill-none stroke-white stroke-2"
                >
                  <polyline
                    points="1,4 4,7 9,1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm text-gray-600">Ingat saya</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-xs text-orange-500 hover:text-orange-600"
          >
            Lupa password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition"
        >
          {isLoading && <CircleNotch size={15} className="animate-spin" />}
          {isLoading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Belum punya akun?{" "}
        <Link
          to="/register"
          className="text-orange-500 hover:text-orange-600 font-semibold"
        >
          Daftar gratis
        </Link>
      </p>
    </AuthLayout>
  );
}
