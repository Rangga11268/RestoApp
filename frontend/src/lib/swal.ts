import Swal from 'sweetalert2'

// ── Toast — corner notification ───────────────────────────
export const Toast = Swal.mixin({
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
    title: 'Hapus data?',
    html: `Yakin ingin menghapus <strong>${name}</strong>?<br>Aksi ini tidak dapat dibatalkan.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    focusCancel: true,
  })

// ── Generic confirm dialog ────────────────────────────────
export const confirmAct = (html: string, confirmText = 'Ya, Lanjutkan') =>
  Swal.fire({
    title: 'Konfirmasi',
    html,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#f97316',
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
    reverseButtons: true,
  })

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
