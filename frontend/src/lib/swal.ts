import Swal from 'sweetalert2'

// ── Pro Max Theme Constants ───────────────────────────────
const PRIMARY_COLOR = '#f97316'
const SLATE_900 = '#0f172a'
const SLATE_500 = '#64748b'
const RED_600 = '#dc2626'

const baseOptions = {
  customClass: {
    popup: 'rounded-[24px] border-none shadow-premium',
    confirmButton: 'rounded-xl px-6 py-2.5 font-medium transition-all active:scale-95',
    cancelButton: 'rounded-xl px-6 py-2.5 font-medium transition-all active:scale-95',
    title: 'text-slate-900 font-bold',
    htmlContainer: 'text-slate-600',
  },
  buttonsStyling: true,
  confirmButtonColor: PRIMARY_COLOR,
  cancelButtonColor: SLATE_500,
}

// ── Toast — corner notification ───────────────────────────
export const Toast = Swal.mixin({
  ...baseOptions,
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  },
})

// ── Confirm delete dialog ─────────────────────────────────
export const confirmDelete = (name: string) =>
  Swal.fire({
    ...baseOptions,
    title: 'Hapus data?',
    html: `Yakin ingin menghapus <strong class="text-slate-900">${name}</strong>?<br><span class="text-sm opacity-80">Aksi ini tidak dapat dibatalkan.</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: RED_600,
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    focusCancel: true,
  })

// ── Generic confirm dialog ────────────────────────────────
export const confirmAct = (html: string, confirmText = 'Ya, Lanjutkan', title = 'Konfirmasi') =>
  Swal.fire({
    ...baseOptions,
    title,
    html,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
    reverseButtons: true,
  })

// ── Loading alert ─────────────────────────────────────────
export const showLoading = (title = 'Mohon Tunggu...') => {
  Swal.fire({
    ...baseOptions,
    title,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading()
    },
  })
}

// ── Success alert ─────────────────────────────────────────
export const showSuccess = (title: string, message?: string) => {
  return Swal.fire({
    ...baseOptions,
    icon: 'success',
    title,
    text: message,
    timer: 2000,
    showConfirmButton: false,
  })
}

// ── API error handler ─────────────────────────────────────
type ApiError = {
  response?: {
    data?: { message?: string; errors?: Record<string, string[]> }
  }
}

export function handleApiError(
  err: unknown,
  setFieldErr?: (field: string, error: { message: string }) => void
): void {
  const res = (err as ApiError)?.response?.data

  if (res?.errors && setFieldErr) {
    Object.entries(res.errors).forEach(([k, v]) => setFieldErr(k, { message: v[0] }))
    const fieldList = Object.keys(res.errors)
      .map((k) => k.replace(/_/g, ' '))
      .join(', ')
    Toast.fire({
      icon: 'error',
      title: 'Validasi gagal',
      text: `Cek isian: ${fieldList}`,
    })
  } else {
    Toast.fire({
      icon: 'error',
      title: 'Terjadi kesalahan',
      text: res?.message ?? 'Silakan coba lagi.',
    })
  }
}
