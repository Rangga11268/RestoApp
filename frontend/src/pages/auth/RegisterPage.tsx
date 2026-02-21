import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

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

  const Field = ({
    id,
    label,
    type = "text",
    placeholder,
    reg,
    error,
  }: {
    id: keyof FormData;
    label: string;
    type?: string;
    placeholder?: string;
    reg: ReturnType<typeof register>;
    error?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        {...reg}
        id={id}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500 mb-4">
              <span className="text-white text-2xl">🍽</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Daftar RestoApp
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              14 hari trial gratis, tanpa kartu kredit
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {errors.root.message}
              </div>
            )}

            <Field
              id="name"
              label="Nama lengkap"
              placeholder="Budi Santoso"
              reg={register("name")}
              error={errors.name?.message}
            />
            <Field
              id="email"
              label="Email"
              type="email"
              placeholder="email@domain.com"
              reg={register("email")}
              error={errors.email?.message}
            />
            <Field
              id="restaurant_name"
              label="Nama restoran"
              placeholder="Warung Sate Pak Budi"
              reg={register("restaurant_name")}
              error={errors.restaurant_name?.message}
            />
            <Field
              id="password"
              label="Password"
              type="password"
              placeholder="Min. 8 karakter"
              reg={register("password")}
              error={errors.password?.message}
            />
            <Field
              id="password_confirmation"
              label="Konfirmasi password"
              type="password"
              placeholder="Ulangi password"
              reg={register("password_confirmation")}
              error={errors.password_confirmation?.message}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition"
            >
              {isLoading ? "Membuat akun..." : "Daftar Gratis"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Sudah punya akun?{" "}
            <Link
              to="/login"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
