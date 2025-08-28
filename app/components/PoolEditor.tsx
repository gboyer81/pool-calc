'use client'

import React, { useState, useEffect } from 'react'
import { Pool } from '@/types/pool-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface PoolEditorProps {
  pool: Pool | null
  isOpen: boolean
  onClose: () => void
  onSave: (poolData: Partial<Pool>) => Promise<void>
  saving?: boolean
  isNew?: boolean
}

const PoolEditor: React.FC<PoolEditorProps> = ({
  pool,
  isOpen,
  onClose,
  onSave,
  saving = false,
}) => {
  const isNew = !pool?._id
  const [formData, setFormData] = useState({
    name: '',
    type: 'residential' as 'residential' | 'commercial',
    shape: 'rectangular' as 'rectangular' | 'circular' | 'oval' | 'kidney' | 'freeform',
    gallons: '',
    avgDepth: '',
    length: '',
    width: '',
    diameter: '',
    filterType: 'sand' as 'sand' | 'cartridge' | 'de',
    filterModel: '',
    pumpModel: '',
    pumpHorsepower: '',
    heaterType: '' as '' | 'gas' | 'electric' | 'heat-pump',
    heaterModel: '',
    phTarget: '7.4',
    phMin: '7.2',
    phMax: '7.6',
    freeChlorineTarget: '3.0',
    freeChlorineMin: '1.0',
    freeChlorineMax: '5.0',
    totalAlkalinityTarget: '100',
    totalAlkalinityMin: '80',
    totalAlkalinityMax: '120',
    notes: '',
  })

  useEffect(() => {
    if (pool) {
      setFormData({
        name: pool.name || '',
        type: pool.type || 'residential',
        shape: pool.shape || 'rectangular',
        gallons: pool.volume?.gallons?.toString() || '',
        avgDepth: pool.dimensions?.avgDepth?.toString() || '',
        length: pool.dimensions?.length?.toString() || '',
        width: pool.dimensions?.width?.toString() || '',
        diameter: pool.dimensions?.diameter?.toString() || '',
        filterType: pool.equipment?.filter?.type || 'sand',
        filterModel: pool.equipment?.filter?.model || '',
        pumpModel: pool.equipment?.pump?.model || '',
        pumpHorsepower: pool.equipment?.pump?.horsepower?.toString() || '',
        heaterType: pool.equipment?.heater?.type || '',
        heaterModel: pool.equipment?.heater?.model || '',
        phTarget: pool.targetLevels?.ph?.target?.toString() || '7.4',
        phMin: pool.targetLevels?.ph?.min?.toString() || '7.2',
        phMax: pool.targetLevels?.ph?.max?.toString() || '7.6',
        freeChlorineTarget: pool.targetLevels?.freeChlorine?.target?.toString() || '3.0',
        freeChlorineMin: pool.targetLevels?.freeChlorine?.min?.toString() || '1.0',
        freeChlorineMax: pool.targetLevels?.freeChlorine?.max?.toString() || '5.0',
        totalAlkalinityTarget: pool.targetLevels?.totalAlkalinity?.target?.toString() || '100',
        totalAlkalinityMin: pool.targetLevels?.totalAlkalinity?.min?.toString() || '80',
        totalAlkalinityMax: pool.targetLevels?.totalAlkalinity?.max?.toString() || '120',
        notes: pool.notes || '',
      })
    }
  }, [pool])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const poolData: Partial<Pool> = {
      _id: pool?._id,
      name: formData.name,
      type: formData.type,
      shape: formData.shape as 'rectangular' | 'circular' | 'oval' | 'kidney' | 'freeform',
      dimensions: {
        avgDepth: parseFloat(formData.avgDepth) || 0,
        length: formData.length ? parseFloat(formData.length) : undefined,
        width: formData.width ? parseFloat(formData.width) : undefined,
        diameter: formData.diameter ? parseFloat(formData.diameter) : undefined,
      },
      volume: {
        gallons: parseInt(formData.gallons) || 0,
        calculatedAt: new Date(),
      },
      equipment: {
        filter: {
          type: formData.filterType,
          model: formData.filterModel || undefined,
        },
        pump: {
          model: formData.pumpModel || undefined,
          horsepower: formData.pumpHorsepower ? parseFloat(formData.pumpHorsepower) : undefined,
        },
        heater: formData.heaterType ? {
          type: formData.heaterType,
          model: formData.heaterModel || undefined,
        } : undefined,
      },
      targetLevels: {
        ph: {
          target: parseFloat(formData.phTarget),
          min: parseFloat(formData.phMin),
          max: parseFloat(formData.phMax),
        },
        freeChlorine: {
          target: parseFloat(formData.freeChlorineTarget),
          min: parseFloat(formData.freeChlorineMin),
          max: parseFloat(formData.freeChlorineMax),
        },
        totalAlkalinity: {
          target: parseFloat(formData.totalAlkalinityTarget),
          min: parseFloat(formData.totalAlkalinityMin),
          max: parseFloat(formData.totalAlkalinityMax),
        },
        calciumHardness: pool?.targetLevels?.calciumHardness || { target: 250, min: 200, max: 400 },
        cyanuricAcid: pool?.targetLevels?.cyanuricAcid || { target: 50, min: 30, max: 100 },
      },
      notes: formData.notes,
    }

    await onSave(poolData)
  }

  if (!pool) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/clients">Client Management</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{isNew ? 'Add Pool' : 'Edit Pool'}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <DialogTitle className="text-blue-700">
            {isNew ? 'Add New Pool' : `Edit Pool: ${pool?.name || ''}`}
          </DialogTitle>
          <DialogDescription>
            {isNew ? 'Create a new pool with complete specifications' : 'Update pool information and chemical target levels'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden">
          <Tabs defaultValue="basic" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
              <TabsTrigger value="targets">Chemical Targets</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-1">
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Pool Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Pool Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="shape">Pool Shape</Label>
                  <Select
                    value={formData.shape}
                    onValueChange={(value) => handleInputChange('shape', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rectangular">Rectangular</SelectItem>
                      <SelectItem value="circular">Circular</SelectItem>
                      <SelectItem value="oval">Oval</SelectItem>
                      <SelectItem value="kidney">Kidney</SelectItem>
                      <SelectItem value="freeform">Freeform</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="dimensions" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gallons">Volume (gallons) *</Label>
                    <Input
                      id="gallons"
                      type="number"
                      min="0"
                      value={formData.gallons}
                      onChange={(e) => handleInputChange('gallons', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="avgDepth">Average Depth (ft) *</Label>
                    <Input
                      id="avgDepth"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.avgDepth}
                      onChange={(e) => handleInputChange('avgDepth', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {formData.shape !== 'circular' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="length">Length (ft)</Label>
                      <Input
                        id="length"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.length}
                        onChange={(e) => handleInputChange('length', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="width">Width (ft)</Label>
                      <Input
                        id="width"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.width}
                        onChange={(e) => handleInputChange('width', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {formData.shape === 'circular' && (
                  <div>
                    <Label htmlFor="diameter">Diameter (ft)</Label>
                    <Input
                      id="diameter"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.diameter}
                      onChange={(e) => handleInputChange('diameter', e.target.value)}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="equipment" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">Filter System</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="filterType">Filter Type</Label>
                      <Select
                        value={formData.filterType}
                        onValueChange={(value) => handleInputChange('filterType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sand">Sand</SelectItem>
                          <SelectItem value="cartridge">Cartridge</SelectItem>
                          <SelectItem value="de">DE (Diatomaceous Earth)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="filterModel">Filter Model</Label>
                      <Input
                        id="filterModel"
                        value={formData.filterModel}
                        onChange={(e) => handleInputChange('filterModel', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">Pump System</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pumpModel">Pump Model</Label>
                      <Input
                        id="pumpModel"
                        value={formData.pumpModel}
                        onChange={(e) => handleInputChange('pumpModel', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="pumpHorsepower">Horsepower (HP)</Label>
                      <Input
                        id="pumpHorsepower"
                        type="number"
                        min="0"
                        step="0.25"
                        value={formData.pumpHorsepower}
                        onChange={(e) => handleInputChange('pumpHorsepower', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">Heater (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="heaterType">Heater Type</Label>
                      <Select
                        value={formData.heaterType}
                        onValueChange={(value) => handleInputChange('heaterType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="gas">Gas</SelectItem>
                          <SelectItem value="electric">Electric</SelectItem>
                          <SelectItem value="heat-pump">Heat Pump</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="heaterModel">Heater Model</Label>
                      <Input
                        id="heaterModel"
                        value={formData.heaterModel}
                        onChange={(e) => handleInputChange('heaterModel', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="targets" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">pH Levels</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="phMin">Minimum pH</Label>
                      <Input
                        id="phMin"
                        type="number"
                        min="6.0"
                        max="8.5"
                        step="0.1"
                        value={formData.phMin}
                        onChange={(e) => handleInputChange('phMin', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phTarget">Target pH</Label>
                      <Input
                        id="phTarget"
                        type="number"
                        min="6.0"
                        max="8.5"
                        step="0.1"
                        value={formData.phTarget}
                        onChange={(e) => handleInputChange('phTarget', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phMax">Maximum pH</Label>
                      <Input
                        id="phMax"
                        type="number"
                        min="6.0"
                        max="8.5"
                        step="0.1"
                        value={formData.phMax}
                        onChange={(e) => handleInputChange('phMax', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">Free Chlorine (ppm)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="freeChlorineMin">Minimum</Label>
                      <Input
                        id="freeChlorineMin"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={formData.freeChlorineMin}
                        onChange={(e) => handleInputChange('freeChlorineMin', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="freeChlorineTarget">Target</Label>
                      <Input
                        id="freeChlorineTarget"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={formData.freeChlorineTarget}
                        onChange={(e) => handleInputChange('freeChlorineTarget', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="freeChlorineMax">Maximum</Label>
                      <Input
                        id="freeChlorineMax"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={formData.freeChlorineMax}
                        onChange={(e) => handleInputChange('freeChlorineMax', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">Total Alkalinity (ppm)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="totalAlkalinityMin">Minimum</Label>
                      <Input
                        id="totalAlkalinityMin"
                        type="number"
                        min="0"
                        max="200"
                        step="5"
                        value={formData.totalAlkalinityMin}
                        onChange={(e) => handleInputChange('totalAlkalinityMin', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalAlkalinityTarget">Target</Label>
                      <Input
                        id="totalAlkalinityTarget"
                        type="number"
                        min="0"
                        max="200"
                        step="5"
                        value={formData.totalAlkalinityTarget}
                        onChange={(e) => handleInputChange('totalAlkalinityTarget', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalAlkalinityMax">Maximum</Label>
                      <Input
                        id="totalAlkalinityMax"
                        type="number"
                        min="0"
                        max="200"
                        step="5"
                        value={formData.totalAlkalinityMax}
                        onChange={(e) => handleInputChange('totalAlkalinityMax', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </form>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (isNew ? 'Creating...' : 'Saving...') : (isNew ? 'Create Pool' : 'Save Pool')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PoolEditor