import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash, List, Tag, Eye, EyeSlash, DotsThreeOutlineVertical, Stack, ArrowsClockwise, Warning } from "@phosphor-icons/react"
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from '@/components/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from '@/services/menuService'
import { Toast, confirmDelete, handleApiError } from '@/lib/swal'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const schema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional(),
  sort_order: z.coerce.number().min(0).optional(),
  is_active: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setCategories(await getCategories())
    } catch {
      setError('Gagal memuat kategori. Periksa koneksi server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', description: '', sort_order: 0, is_active: true })
    setModalOpen(true)
  }
  const openEdit = (cat: Category) => {
    setEditing(cat)
    reset({
      name: cat.name,
      description: cat.description ?? '',
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await updateCategory(editing.id, data)
        Toast.fire({ icon: 'success', title: 'Category updated successfully' })
      } else {
        await createCategory(data)
        Toast.fire({ icon: 'success', title: 'Category added successfully' })
      }
      setModalOpen(false)
      await load()
    } catch (err: unknown) {
      handleApiError(err, (k, e) => setFieldError(k as keyof FormData, e))
    }
  }

  const handleDelete = async (cat: Category) => {
    const result = await confirmDelete(cat.name)
    if (!result.isConfirmed) return
    try {
      await deleteCategory(cat.id)
      Toast.fire({ icon: 'success', title: 'Category deleted successfully' })
      await load()
    } catch (err: unknown) {
      handleApiError(err)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 selection:bg-accent/20">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <Badge variant="primary" className="mb-2">Menu Structure</Badge>
           <h1 className="text-4xl font-black text-ink tracking-tighter">Kitchen Categories</h1>
           <p className="text-sm font-medium text-ink-2 mt-1">
             Manage your menu hierarchy and organization.
           </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 bg-surface border border-rule-light rounded-lg text-sm font-bold text-ink-2 hidden md:flex items-center gap-2">
            <span className="text-accent font-black">{categories.length}</span> Total Categories
          </div>
          <Button
            onClick={openCreate}
            className="shadow-xl shadow-accent/20 rounded-lg px-6"
          >
            <Plus size={20} weight="bold" className="mr-2" /> New Category
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className="flex items-start gap-4 p-5 bg-danger/5 border border-danger/10 rounded-lg">
          <Warning size={24} weight="bold" className="text-danger flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-black text-danger text-xs uppercase tracking-widest mb-1">Gagal memuat data</p>
            <p className="text-sm text-danger font-medium">{error}</p>
          </div>
          <button onClick={load} className="text-danger hover:text-danger/70 font-bold text-xs uppercase tracking-widest shrink-0 self-start">
            Coba Lagi
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface border border-rule rounded-lg overflow-hidden animate-pulse">
              <div className="h-24 bg-gray-200" />
              <div className="p-6 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="flex gap-2 pt-4">
                  <div className="h-10 bg-gray-200 rounded-lg flex-1" />
                  <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-40 bg-surface/50 backdrop-blur rounded-[48px] border border-rule-light border-dashed flex flex-col items-center">
          <div className="w-24 h-24 bg-paper-2 rounded-full flex items-center justify-center mb-6">
            <Stack size={48} weight="bold" className="text-slate-200" />
          </div>
          <p className="font-black text-lg text-ink tracking-tight">
            No Categories Yet
          </p>
          <p className="text-ink-2 text-sm font-medium mt-2 mb-8 max-w-[280px]">
            Start by grouping your food and drinks. It helps customers find what they love!
          </p>
          <Button
            onClick={openCreate}
            variant="secondary"
            className="rounded-lg px-8"
          >
            <Plus size={18} weight="bold" className="mr-2" /> Add First Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat, idx) => (
            <Card
              key={cat.id}
              animated
              className={cn(
                  "p-0 flex flex-col overflow-hidden group transition-all",
                  !cat.is_active && "opacity-60 grayscale"
              )}
            >
              {/* Visual Identity Header */}
              <div className="h-24 bg-slate-900 relative overflow-hidden flex items-end px-6 pb-4">
                 <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/30 to-transparent" />
                    <Tag size={120} weight="bold" className="absolute -right-4 -top-8 text-white/10" />
                 </div>
                 <div className="relative z-10 w-full flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-surface/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-md">
                        {cat.name[0]}
                    </div>
                    <Badge variant={cat.is_active ? 'success' : 'muted'} className="text-[9px]">
                        {cat.is_active ? 'ONLINE' : 'OFFLINE'}
                    </Badge>
                 </div>
              </div>

              {/* Content Area */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-md font-black text-ink tracking-tighter group-hover:text-accent transition-colors">
                        {cat.name}
                    </h3>
                    <span className="text-[10px] font-black text-slate-300 bg-paper-2 px-2.5 py-1 rounded-lg">
                        ORDER #{cat.sort_order}
                    </span>
                </div>
                
                <p className="text-xs text-ink-2 font-medium line-clamp-2 min-h-[32px] mb-6">
                    {cat.description || "No description provided for this category."}
                </p>

                <div className="flex items-center justify-between py-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent/5 flex items-center justify-center text-accent font-black text-xs">
                            {cat.menu_items_count ?? 0}
                        </div>
                        <span className="text-[10px] font-black text-ink-2 uppercase tracking-widest">Items listed</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button 
                        onClick={() => openEdit(cat)}
                        variant="secondary" 
                        className="flex-1 rounded-lg h-10 text-[10px] font-black bg-paper-2 border-rule-light hover:bg-slate-900 hover:text-white transition-all"
                    >
                        <Pencil size={14} weight="bold" className="mr-2" /> EDIT
                    </Button>
                    <Button 
                        onClick={() => handleDelete(cat)}
                        variant="secondary"
                        className="w-10 h-10 rounded-lg px-0 bg-paper-2 border-rule-light hover:text-danger hover:border-danger/20 transition-all text-ink-2"
                    >
                        <Trash size={16} weight="bold" />
                    </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Refine Category' : 'New Category'}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-ink-2 uppercase tracking-widest mb-2">Display Name</label>
              <Input
                {...register('name')}
                placeholder="e.g. Signature Bowls, Hot Beverages"
              />
              {errors.name && (
                <p className="text-xs font-bold text-danger mt-2 pl-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-ink-2 uppercase tracking-widest mb-2">Brief Description</label>
              <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full rounded-lg border border-rule px-5 py-4 text-sm font-bold text-ink focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all bg-paper-2 placeholder:text-slate-300 resize-none outline-none"
                    placeholder="Tell your customers about this group..."
                />
              {errors.description && (
                <p className="text-xs font-bold text-danger mt-2 pl-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black text-ink-2 uppercase tracking-widest mb-2">Display Order</label>
                    <Input
                        {...register('sort_order')}
                        type="number"
                        min={0}
                    />
                </div>
                <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-3 h-12 px-4 bg-paper-2 border border-rule rounded-lg cursor-pointer hover:bg-slate-100 transition-all">
                        <input
                            {...register('is_active')}
                            type="checkbox"
                            className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent/15 bg-surface transition-all cursor-pointer"
                        />
                        <span className="text-[10px] font-black text-ink-2 uppercase tracking-widest">Active</span>
                    </label>
                </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-[2] rounded-lg shadow-xl shadow-accent/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Syncing...' : editing ? 'Update Category' : 'Save Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
