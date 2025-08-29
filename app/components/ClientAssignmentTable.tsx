'use client'

import React from 'react'
import {
  ShoppingCart,
  Wrench,
  Calendar,
  Users,
  MoreHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ColumnsIcon,
  UserCheck,
  UserX,
  UserPlus,
} from 'lucide-react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { getStatusBadgeConfig } from '@/lib/badge-utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Client {
  _id: string
  name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  clientType?: 'retail' | 'service' | 'maintenance'
  serviceFrequency?: 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly'
  serviceDay?: string
  isActive: boolean
  assignedTechnician?: string
}

interface Technician {
  _id: string
  name: string
  email: string
  phone: string
  employeeId: string
  role: 'technician' | 'supervisor' | 'admin'
  assignedClients: string[]
  isActive: boolean
  serviceAreas: string[]
}

interface ClientAssignmentTableProps {
  clients: Client[]
  technicians: Technician[]
  onAssignClient?: (clientId: string, technicianId: string) => void
  onUnassignClient?: (clientId: string) => void
  loading?: boolean
}

const getClientTypeIcon = (type: string | undefined) => {
  switch (type) {
    case 'retail':
      return <ShoppingCart className='h-4 w-4 text-green-600' />
    case 'service':
      return <Wrench className='h-4 w-4 text-orange-600' />
    case 'maintenance':
      return <Calendar className='h-4 w-4 text-blue-600' />
    default:
      return <Users className='h-4 w-4 text-gray-600' />
  }
}

const getAssignedTechnician = (client: Client, technicians: Technician[]): Technician | null => {
  return technicians.find(tech => tech.assignedClients.includes(client._id)) || null
}

const formatServiceFrequency = (frequency: string | undefined) => {
  if (!frequency || typeof frequency !== 'string') return 'Not set'
  return frequency.replace('-', ' ')
}

const columns = (
  technicians: Technician[],
  onAssignClient?: (clientId: string, technicianId: string) => void,
  onUnassignClient?: (clientId: string) => void
): ColumnDef<Client>[] => [
  {
    accessorKey: 'name',
    header: 'Client',
    cell: ({ row }) => {
      const client = row.original
      return (
        <div className='flex items-center'>
          {getClientTypeIcon(client.clientType || 'maintenance')}
          <div className='ml-3'>
            <div className='text-sm font-medium text-foreground'>
              {client.name}
            </div>
            <div className='text-sm text-muted-foreground'>
              {client.address.city}, {client.address.state}
            </div>
            <div className='text-xs text-muted-foreground'>
              {client.email}
            </div>
          </div>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: 'clientType',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('clientType') as string
      const getTypeStyles = (type: string) => {
        switch (type) {
          case 'retail':
            return 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
          case 'service':
            return 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300'
          default:
            return 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
        }
      }
      
      return (
        <Badge variant="outline" className={`capitalize ${getTypeStyles(type)}`}>
          <div className='flex items-center gap-1'>
            {type === 'retail' && <ShoppingCart className="h-3 w-3" />}
            {type === 'service' && <Wrench className="h-3 w-3" />}
            {type === 'maintenance' && <Calendar className="h-3 w-3" />}
            {type}
          </div>
        </Badge>
      )
    },
  },
  {
    id: 'serviceFrequency',
    header: 'Service Frequency',
    cell: ({ row }) => {
      const client = row.original
      return (
        <div className='text-sm text-muted-foreground'>
          {formatServiceFrequency(client.serviceFrequency)}
        </div>
      )
    },
  },
  {
    id: 'assignedTechnician',
    header: 'Assigned Technician',
    cell: ({ row }) => {
      const client = row.original
      const assignedTech = getAssignedTechnician(client, technicians)
      
      return (
        <div className='space-y-2'>
          {assignedTech ? (
            <div className='flex items-center gap-2'>
              <UserCheck className='h-4 w-4 text-green-600' />
              <div>
                <div className='text-sm font-medium text-foreground'>
                  {assignedTech.name}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {assignedTech.email}
                </div>
              </div>
            </div>
          ) : (
            <div className='flex items-center gap-2'>
              <UserX className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm text-muted-foreground'>Unassigned</span>
            </div>
          )}
        </div>
      )
    },
  },
  {
    id: 'contact',
    header: 'Contact',
    cell: ({ row }) => {
      const client = row.original
      return (
        <div>
          <div className='text-sm text-foreground'>{client.phone}</div>
          <div className='text-xs text-muted-foreground'>
            {client.address.street}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      const config = getStatusBadgeConfig(isActive)
      return (
        <Badge variant={config.variant} className={config.className}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const client = row.original
      const assignedTech = getAssignedTechnician(client, technicians)
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {!assignedTech && onAssignClient && (
              <DropdownMenuItem>
                <UserPlus className='mr-2 h-4 w-4' />
                Assign Technician
              </DropdownMenuItem>
            )}
            {assignedTech && onUnassignClient && (
              <DropdownMenuItem onClick={() => onUnassignClient(client._id)}>
                <UserX className='mr-2 h-4 w-4' />
                Unassign Technician
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              Edit Client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

const ClientAssignmentTable: React.FC<ClientAssignmentTableProps> = ({
  clients,
  technicians,
  onAssignClient,
  onUnassignClient,
  loading = false,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data: clients,
    columns: columns(technicians, onAssignClient, onUnassignClient),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
  })

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='h-8 bg-muted animate-pulse rounded' />
        <div className='border rounded-lg'>
          <div className='p-8 text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto' />
            <p className='mt-2 text-muted-foreground'>Loading client assignments...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Table Controls */}
      <div className='flex items-center justify-between'>
        <div className='text-sm text-muted-foreground'>
          Showing {clients.length} clients
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' className='ml-auto'>
              <ColumnsIcon className='mr-2 h-4 w-4' />
              View
              <ChevronDown className='ml-2 h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className='capitalize'
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id === 'clientType' ? 'Type' : 
                     column.id === 'serviceFrequency' ? 'Service Frequency' :
                     column.id === 'assignedTechnician' ? 'Assigned Technician' :
                     column.id === 'isActive' ? 'Status' : column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Data Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='hover:bg-muted/50'
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No clients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className='flex items-center justify-between px-2'>
        <div className='flex-1 text-sm text-muted-foreground'>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className='flex items-center space-x-6 lg:space-x-8'>
          <div className='flex items-center space-x-2'>
            <p className='text-sm font-medium'>Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className='h-8 w-[70px]'>
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side='top'>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              className='hidden h-8 w-8 p-0 lg:flex'
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className='sr-only'>Go to first page</span>
              <ChevronsLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className='sr-only'>Go to previous page</span>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className='sr-only'>Go to next page</span>
              <ChevronRight className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='hidden h-8 w-8 p-0 lg:flex'
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className='sr-only'>Go to last page</span>
              <ChevronsRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientAssignmentTable