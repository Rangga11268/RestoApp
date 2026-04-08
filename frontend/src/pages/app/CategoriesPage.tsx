import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash, List, Tag, Eye, EyeSlash, DotsThreeOutlineVertical, Stack, ArrowsClockwise } from "@phosphor-icons/react"
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
    try {
      setCategories(await getCategories())
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
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in selection:bg-primary/20">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <Badge variant="primary" className="mb-2">Menu Structure</Badge>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Kitchen Categories</h1>
           <p className="text-sm font-medium text-slate-400 mt-1">
             Manage your menu hierarchy and organization.
           </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 shadow-sm hidden md:flex items-center gap-2">
            <span className="text-primary font-black">{categories.length}</span> Total Categories
          </div>
          <Button
            onClick={openCreate}
            className="shadow-xl shadow-primary/20 rounded-2xl px-6"
          >
            <Plus size={20} weight="bold" className="mr-2" /> New Category
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300">
          <ArrowsClockwise size={48} className="animate-spin mb-4 text-primary opacity-20" />
          <span className="font-black text-xs uppercase tracking-[0.2em] animate-pulse">Organizing Pantry...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-40 bg-white/50 backdrop-blur rounded-[48px] border border-slate-100 border-dashed flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Stack size={48} weight="duotone" className="text-slate-200" />
          </div>
          <p className="font-black text-2xl text-slate-900 tracking-tight">
            No Categories Yet
          </p>
          <p className="text-slate-400 text-sm font-medium mt-2 mb-8 max-w-[280px]">
            Start by grouping your food and drinks. It helps customers find what they love!
          </p>
          <Button
            onClick={openCreate}
            variant="secondary"
            className="rounded-2xl px-8"
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
                  "p-0 flex flex-col overflow-hidden group transition-all duration-300",
                  !cat.is_active && "opacity-60 grayscale"
              )}
            >
              {/* Visual Identity Header */}
              <div className="h-24 bg-slate-900 relative overflow-hidden flex items-end px-6 pb-4">
                 <div className="absolute inset-0 opacity-20 transition-transform group-hover:scale-110 duration-700">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
                    <Tag size={120} weight="duotone" className="absolute -right-4 -top-8 rotate-12 text-white" />
                 </div>
                 <div className="relative z-10 w-full flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-xl">
                        {cat.name[0]}
                    </div>
                    <Badge variant={cat.is_active ? 'success' : 'glass'} className="text-[9px]">
                        {cat.is_active ? 'ONLINE' : 'OFFLINE'}
                    </Badge>
                 </div>
              </div>

              {/* Content Area */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter group-hover:text-primary transition-colors">
                        {cat.name}
                    </h3>
                    <span className="text-[10px] font-black text-slate-300 bg-slate-50 px-2.5 py-1 rounded-lg">
                        ORDER #{cat.sort_order}
                    </span>
                </div>
                
                <p className="text-xs text-slate-400 font-medium line-clamp-2 min-h-[32px] mb-6">
                    {cat.description || "No description provided for this category."}
                </p>

                <div className="flex items-center justify-between py-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-xs">
                            {cat.menu_items_count ?? 0}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items listed</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button 
                        onClick={() => openEdit(cat)}
                        variant="secondary" 
                        className="flex-1 rounded-xl h-10 text-[10px] font-black bg-slate-50 border-slate-100 hover:bg-slate-900 hover:text-white transition-all"
                    >
                        <Pencil size={14} weight="bold" className="mr-2" /> EDIT
                    </Button>
                    <Button 
                        onClick={() => handleDelete(cat)}
                        variant="secondary"
                        className="w-10 h-10 rounded-xl px-0 bg-slate-50 border-slate-100 hover:text-danger hover:border-danger/20 transition-all text-slate-400"
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
              <Input
                {...register('name')}
                placeholder="e.g. Signature Bowls, Hot Beverages"
              />
              {errors.name && (
                <p className="text-xs font-bold text-danger mt-2 pl-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Brief Description</label>
              <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-slate-50 placeholder:text-slate-300 resize-none outline-none"
                    placeholder="Tell your customers about this group..."
                />
              {errors.description && (
                <p className="text-xs font-bold text-danger mt-2 pl-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Display Order</label>
                    <Input
                        {...register('sort_order')}
                        type="number"
                        min={0}
                    />
                </div>
                <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-3 h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                        <input
                            {...register('is_active')}
                            type="checkbox"
                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20 bg-white transition-all cursor-pointer"
                        />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active</span>
                    </label>
                </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-2xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-[2] rounded-2xl shadow-xl shadow-primary/20"
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


