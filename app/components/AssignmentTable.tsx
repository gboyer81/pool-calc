'use client'

import React from 'react'
import {
  UserCheck,
  UserX,
  Users,
  MoreHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ColumnsIcon,
  UserPlus,
  UserMinus,
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
  DropdownMenuSeparator,
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

interface AssignmentTableProps {
  technicians: Technician[]
  clients: Client[]
  onAssignClient?: (technicianId: string, clientId: string) => void
  onRemoveClient?: (technicianId: string, clientId: string) => void
  onViewAssignments?: (technician: Technician) => void
  loading?: boolean
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    case 'supervisor':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'technician':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

const getClientById = (clients: Client[], clientId: string): Client | undefined => {
  return clients.find(client => client._id === clientId)
}

const columns = (
  clients: Client[],
  onAssignClient?: (technicianId: string, clientId: string) => void,
  onRemoveClient?: (technicianId: string, clientId: string) => void,
  onViewAssignments?: (technician: Technician) => void
): ColumnDef<Technician>[] => [
  {
    accessorKey: 'name',
    header: 'Technician',
    cell: ({ row }) => {
      const technician = row.original
      return (
        <div className='flex items-center'>
          <div className='flex-shrink-0 h-10 w-10'>
            <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
              <Users className='h-5 w-5 text-primary' />
            </div>
          </div>
          <div className='ml-4'>
            <div className='text-sm font-medium text-foreground'>
              {technician.name}
            </div>
            <div className='text-sm text-muted-foreground'>
              {technician.email}
            </div>
            <div className='text-xs text-muted-foreground'>
              ID: {technician.employeeId}
            </div>
          </div>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      return (
        <Badge className={getRoleBadgeColor(role)}>
          {role.toUpperCase()}
        </Badge>
      )
    },
  },
  {
    id: 'assignedClients',
    header: 'Assigned Clients',
    cell: ({ row }) => {
      const technician = row.original
      const assignedClients = technician.assignedClients
        .map(clientId => getClientById(clients, clientId))
        .filter(Boolean) as Client[]

      return (
        <div className='space-y-2'>
          <div className='text-sm font-medium text-foreground'>
            {assignedClients.length} clients assigned
          </div>
          <div className='space-y-1'>
            {assignedClients.slice(0, 3).map((client) => (
              <div
                key={client._id}
                className='flex items-center justify-between bg-muted/50 p-2 rounded text-xs'
              >
                <div>
                  <span className='font-medium'>{client.name}</span>
                  <span className='text-muted-foreground ml-2'>
                    {client.address.city}
                  </span>
                </div>
                {onRemoveClient && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => onRemoveClient(technician._id, client._id)}
                    className='h-6 w-6 p-0 text-destructive hover:text-destructive'
                  >
                    <UserMinus className='h-3 w-3' />
                  </Button>
                )}
              </div>
            ))}
            {assignedClients.length > 3 && (
              <div className='text-xs text-muted-foreground'>
                +{assignedClients.length - 3} more
              </div>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'serviceAreas',
    header: 'Service Areas',
    cell: ({ row }) => {
      const serviceAreas = row.getValue('serviceAreas') as string[]
      return (
        <div className='text-sm text-muted-foreground'>
          {serviceAreas.length > 0 ? serviceAreas.join(', ') : 'No areas set'}
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
          {isActive ? (
            <>
              <UserCheck className='mr-1 h-3 w-3' />
              Active
            </>
          ) : (
            <>
              <UserX className='mr-1 h-3 w-3' />
              Inactive
            </>
          )}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const technician = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {onViewAssignments && (
              <DropdownMenuItem onClick={() => onViewAssignments(technician)}>
                <Users className='mr-2 h-4 w-4' />
                View All Assignments
              </DropdownMenuItem>
            )}
            {onAssignClient && (
              <DropdownMenuItem onClick={() => {/* TODO: Open assign modal */}}>
                <UserPlus className='mr-2 h-4 w-4' />
                Assign Client
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Edit Technician
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

const AssignmentTable: React.FC<AssignmentTableProps> = ({
  technicians,
  clients,
  onAssignClient,
  onRemoveClient,
  onViewAssignments,
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
    data: technicians,
    columns: columns(clients, onAssignClient, onRemoveClient, onViewAssignments),
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
            <p className='mt-2 text-muted-foreground'>Loading assignments...</p>
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
          Showing {technicians.length} technicians
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
                    {column.id === 'assignedClients' ? 'Assigned Clients' : 
                     column.id === 'serviceAreas' ? 'Service Areas' : 
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
                  No technicians found.
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

export default AssignmentTable