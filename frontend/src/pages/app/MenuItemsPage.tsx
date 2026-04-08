import { useEffect, useRef, useState } from 'react'
import { 
    Plus, Pencil, Trash, ImageBroken, ToggleRight, ToggleLeft, 
    ArrowsClockwise, MagnifyingGlass, Funnel, Star, 
    ChefHat, Clock, CurrencyDollar, Camera,
    DotsThreeOutlineVertical, CheckCircle, WarningCircle
} from "@phosphor-icons/react"
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from '@/components/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleMenuItem,
  deleteMenuItem,
  getCategories,
  type MenuItem,
  type Category,
} from '@/services/menuService'
import { Toast, confirmDelete, handleApiError } from '@/lib/swal'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const schema = z.object({
  category_id: z.coerce.number().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  preparation_time: z.coerce.number().min(0).optional(),
  is_available: z.boolean().optional(),
  is_featured: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldErr,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  })

  const load = async () => {
    setLoading(true)
    try {
      const [its, cats] = await Promise.all([
        getMenuItems(filterCat ? { category_id: filterCat } : {}),
        getCategories(),
      ])
      setItems(its)
      setCategories(cats)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filterCat])

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openCreate = () => {
    setEditing(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
    reset({
      category_id: 0,
      name: '',
      description: '',
      price: 0,
      preparation_time: 0,
      is_available: true,
      is_featured: false,
    })
    setModalOpen(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditing(item)
    setImagePreview(item.image_url)
    if (fileRef.current) fileRef.current.value = ''
    reset({
      category_id: item.category_id,
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      preparation_time: item.preparation_time,
      is_available: item.is_available,
      is_featured: item.is_featured,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (v === undefined || v === null) return
      if (typeof v === 'boolean') {
        fd.append(k, v ? '1' : '0')
      } else {
        fd.append(k, String(v))
      }
    })
    if (fileRef.current?.files?.[0]) fd.append('image', fileRef.current.files[0])

    try {
      if (editing) {
        await updateMenuItem(editing.id, fd)
        Toast.fire({ icon: 'success', title: 'Product updated' })
      } else {
        await createMenuItem(fd)
        Toast.fire({ icon: 'success', title: 'Product added' })
      }
      setModalOpen(false)
      await load()
    } catch (err: unknown) {
      handleApiError(err, (k, e) => setFieldErr(k as keyof FormData, e))
    }
  }

  const doToggle = async (item: MenuItem) => {
    try {
        await toggleMenuItem(item.id)
        setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i))
        )
        Toast.fire({ 
            icon: 'success', 
            title: `${item.name} is now ${!item.is_available ? 'Available' : 'Sold Out'}`,
            timer: 1500,
            showConfirmButton: false
        })
    } catch (err) {
        handleApiError(err)
    }
  }

  const handleDelete = async (item: MenuItem) => {
    const result = await confirmDelete(item.name)
    if (!result.isConfirmed) return
    try {
      await deleteMenuItem(item.id)
      Toast.fire({ icon: 'success', title: 'Product removed' })
      await load()
    } catch (err: unknown) {
      handleApiError(err)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-in selection:bg-primary/20">
      {/* Header Premium */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <Badge variant="primary" className="mb-2">Menu Inventory</Badge>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Kitchen Catalog</h1>
           <p className="text-sm font-medium text-slate-400 mt-1">
             Manage your items, pricing, and availability.
           </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           {/* Search Bar */}
           <div className="relative min-w-[240px]">
                <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes..."
                    className="w-full h-12 pl-12 pr-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                />
           </div>

           {/* Filter */}
           <div className="relative min-w-[180px]">
                <Funnel size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                    value={filterCat}
                    onChange={(e) => setFilterCat(e.target.value)}
                    className="w-full h-12 pl-12 pr-10 bg-white border border-slate-100 rounded-2xl text-sm font-black text-slate-600 appearance-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm uppercase tracking-widest cursor-pointer"
                >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                        {c.name}
                    </option>
                    ))}
                </select>
           </div>

          <Button
            onClick={openCreate}
            className="shadow-xl shadow-primary/20 rounded-2xl h-12 px-6 ml-auto lg:ml-0"
          >
            <Plus size={20} weight="bold" className="mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300">
          <ArrowsClockwise size={48} className="animate-spin mb-4 text-primary opacity-20" />
          <span className="font-black text-xs uppercase tracking-[0.2em] animate-pulse">Polishing the menu...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-40 bg-white/50 backdrop-blur rounded-[48px] border border-slate-100 border-dashed flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <ChefHat size={48} weight="duotone" className="text-slate-200" />
          </div>
          <p className="font-black text-2xl text-slate-900 tracking-tight">
            Kitchen is Empty
          </p>
          <p className="text-slate-400 text-sm font-medium mt-2 mb-8 max-w-[280px]">
            No menu items found. {searchQuery ? 'Try a different search!' : 'Add your first signature dish today!'}
          </p>
          {searchQuery ? (
             <Button onClick={() => setSearchQuery('')} variant="secondary" className="rounded-2xl px-8">Clear Search</Button>
          ) : (
            <Button onClick={openCreate} variant="primary" className="rounded-2xl px-8">Add Item</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-10">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              animated
              className={cn(
                  "p-0 flex flex-col overflow-hidden group transition-all duration-300",
                  !item.is_available && "opacity-60 grayscale"
              )}
            >
              {/* Image Section */}
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageBroken size={48} weight="duotone" />
                  </div>
                )}
                
                {/* Overlays */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {item.is_featured && (
                    <Badge variant="primary" className="py-1 shadow-lg backdrop-blur-md bg-primary/90 border-transparent">
                        <Star size={12} weight="fill" className="mr-1" /> FEATURED
                    </Badge>
                    )}
                    <Badge variant={item.is_available ? 'success' : 'glass'} className="py-1 shadow-lg backdrop-blur-md">
                        {item.is_available ? 'AVAILABLE' : 'SOLD OUT'}
                    </Badge>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Info Section */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">{item.category?.name}</p>
                    <h3 className="text-lg font-black text-slate-900 tracking-tighter line-clamp-1">{item.name}</h3>
                </div>

                <p className="text-xs text-slate-400 font-medium line-clamp-2 mb-6 min-h-[32px]">
                    {item.description || "Freshly prepared with the best ingredients."}
                </p>

                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Price</span>
                        <span className="text-lg font-black text-slate-900 tracking-tighter">
                            {formatCurrency(item.price)}
                        </span>
                    </div>
                    {item.preparation_time > 0 && (
                        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <Clock size={12} weight="bold" />
                            <span className="text-[10px] font-black">{item.preparation_time}m</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-2">
                    <Button 
                        onClick={() => doToggle(item)}
                        variant="secondary"
                        className={cn(
                            "flex-1 h-10 rounded-xl px-0 border-slate-100 transition-all",
                            item.is_available ? "text-success hover:bg-success/5" : "text-slate-400 hover:bg-slate-50"
                        )}
                    >
                         {item.is_available ? <CheckCircle size={20} weight="fill" /> : <WarningCircle size={20} weight="fill" />}
                    </Button>
                    <Button 
                        onClick={() => openEdit(item)}
                        variant="secondary"
                        className="flex-1 h-10 rounded-xl px-0 border-slate-100 hover:bg-slate-900 hover:text-white transition-all text-slate-600"
                    >
                        <Pencil size={18} weight="bold" />
                    </Button>
                    <Button 
                        onClick={() => handleDelete(item)}
                        variant="secondary"
                        className="flex-1 h-10 rounded-xl px-0 border-slate-100 hover:text-danger hover:border-danger/20 transition-all text-slate-400"
                    >
                        <Trash size={18} weight="bold" />
                    </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Refine Dish Details' : 'New Signature Dish'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-2">
          {/* Top Section: Media & Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Image Upload Column */}
            <div className="md:col-span-5 space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Visual Presentation</label>
                <div 
                    onClick={() => fileRef.current?.click()}
                    className="aspect-[4/5] rounded-[32px] border-4 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/20 hover:bg-primary/5 transition-all overflow-hidden relative group"
                >
                    {imagePreview ? (
                        <>
                            <img src={imagePreview} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Camera size={40} weight="duotone" className="text-white" />
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-slate-400">
                             <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center text-slate-200">
                                <Camera size={32} weight="duotone" />
                             </div>
                             <div className="text-center px-6">
                                <p className="text-xs font-black text-slate-900 mb-1 tracking-tight">Add Food Photo</p>
                                <p className="text-[10px] font-medium leading-relaxed">High-res images increase orders by 25%.</p>
                             </div>
                        </div>
                    )}
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) setImagePreview(URL.createObjectURL(f))
                        }}
                    />
                </div>
            </div>

            {/* Form Fields Column */}
            <div className="md:col-span-7 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Product Identity</label>
                        <Input {...register('name')} placeholder="e.g. Signature Truffle Pizza" className="h-12 font-bold" />
                        {errors.name && <p className="text-[10px] font-black text-danger mt-2 pl-2">⚠ {errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Category</label>
                            <select
                                {...register('category_id')}
                                className="w-full h-12 rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-900 focus:ring-4 focus:ring-primary/10 transition-all bg-slate-50 cursor-pointer appearance-none outline-none"
                            >
                                <option value={0}>-- Select --</option>
                                {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.category_id && <p className="text-[10px] font-black text-danger mt-2 pl-2">⚠ {errors.category_id.message}</p>}
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Base Price (IDR)</label>
                            <Input {...register('price')} type="number" min={0} placeholder="0" className="h-12 font-bold" />
                            {errors.price && <p className="text-[10px] font-black text-danger mt-2 pl-2">⚠ {errors.price.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Story & Ingredients</label>
                        <textarea
                            {...register('description')}
                            rows={4}
                            className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary/10 transition-all bg-slate-50 placeholder:text-slate-300 resize-none outline-none"
                            placeholder="Describe the flavors..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Kitchen Time (Min)</label>
                            <Input {...register('preparation_time')} type="number" min={0} className="h-12 font-bold" />
                        </div>
                        <div className="flex flex-col justify-end">
                            <div className="flex items-center gap-4 h-12 px-5 bg-slate-50 border border-slate-200 rounded-2xl">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer group">
                                    <input {...register('is_available')} type="checkbox" className="w-5 h-5 rounded border-slate-300 text-primary transition-all cursor-pointer" />
                                    <span>Stock Available</span>
                                </label>
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer group">
                                    <input {...register('is_featured')} type="checkbox" className="w-5 h-5 rounded border-slate-300 text-primary transition-all cursor-pointer" />
                                    <span>Featured ⭐</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-50">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button 
                variant="primary" 
                type="submit" 
                className="flex-[2] rounded-2xl h-14 font-black uppercase tracking-widest shadow-xl shadow-primary/20" 
                disabled={isSubmitting}
            >
              {isSubmitting ? 'Syncing...' : editing ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
