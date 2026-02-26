import React from 'react'
import { Button, Input, Card, Badge } from '@/components/ui'
import { Banknote } from 'lucide-react'

export default function ComponentsPreviewPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <h1 className="text-2xl font-bold">Components preview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Buttons</h2>
          <div className="flex gap-2 flex-wrap">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button className="flex items-center gap-2">
              <Banknote size={14} />
              Pay
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Inputs</h2>
          <div className="space-y-2">
            <Input placeholder="Text input" />
            <Input placeholder="Number" type="number" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm font-semibold">Card</p>
          <p className="text-xs text-gray-500 mt-1">Use for small info panels.</p>
        </Card>

        <div className="flex items-center gap-2">
          <Badge>Default</Badge>
          <Badge className="bg-green-100 text-green-700">Success</Badge>
        </div>
      </div>
    </div>
  )
}
