import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Building2,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import AuthLayout from "@/components/auth/AuthLayout";

const schema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    restaurant_name: z.string().min(2, "Nama restoran minimal 2 karakter"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Konfirmasi password tidak cocok",
    path: ["password_confirmation"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: doRegister, isLoading } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await doRegister({ ...data, timezone: "Asia/Jakarta" });
      navigate("/dashboard");
    } catch (err: unknown) {
      const res = (
        err as {
          response?: {
            data?: { message?: string; errors?: Record<string, string[]> };
          };
        }
      )?.response?.data;
      if (res?.errors) {
        Object.entries(res.errors).forEach(([field, msgs]) => {
          setError(field as keyof FormData, { message: msgs[0] });
        });
      } else {
        setError("root", { message: res?.message ?? "Registrasi gagal." });
      }
    }
  };

  const inputCls =
    "w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition placeholder:text-gray-400";

  return (
    <AuthLayout>
      {/* Mobile brand */}
      <div className="flex items-center gap-2 mb-6 lg:hidden">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <span className="text-sm">🍽</span>
        </div>
        <span className="font-bold text-gray-900 text-lg">RestoApp</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Buat akun baru</h1>
      <p className="text-sm text-gray-500 mb-7">
        14 hari trial gratis, tanpa kartu kredit
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700 flex items-start gap-2">
            <span className="flex-shrink-0 mt-px">⚠</span>
            <span>{errors.root.message}</span>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nama lengkap
          </label>
          <div className="relative">
            <User
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              {...register("name")}
              placeholder="Budi Santoso"
              className={inputCls}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
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
              className={inputCls}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Restaurant name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nama restoran
          </label>
          <div className="relative">
            <Building2
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              {...register("restaurant_name")}
              placeholder="Warung Sate Pak Budi"
              className={inputCls}
            />
          </div>
          {errors.restaurant_name && (
            <p className="text-xs text-red-500 mt-1">
              {errors.restaurant_name.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock
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
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Konfirmasi password
          </label>
          <div className="relative">
            <Lock
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              {...register("password_confirmation")}
              type={showConfirm ? "text" : "password"}
              placeholder="Ulangi password"
              className="w-full rounded-lg border border-gray-300 pl-9 pr-10 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
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
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition mt-1"
        >
          {isLoading && <Loader2 size={15} className="animate-spin" />}
          {isLoading ? "Membuat akun..." : "Daftar Gratis"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Sudah punya akun?{" "}
        <Link
          to="/login"
          className="text-orange-500 hover:text-orange-600 font-semibold"
        >
          Masuk
        </Link>
      </p>
    </AuthLayout>
  );
}
