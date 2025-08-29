'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconMapPin,
  IconClock,
  IconPlayerPlay,
  IconCircleCheck,
  IconCircleX,
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TodaysRoute {
  client: {
    _id: string
    name: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
    }
    serviceFrequency: string
    specialInstructions?: string
  }
  estimatedTime: string
  status: 'pending' | 'in-progress' | 'completed' | 'skipped'
  pools: number
}

interface RouteDataTableProps {
  data: TodaysRoute[]
  onUpdateStatus: (clientId: string, status: TodaysRoute['status']) => void
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <IconCircleCheck className="h-4 w-4 text-green-600" />
    case 'in-progress':
      return <IconPlayerPlay className="h-4 w-4 text-blue-600" />
    case 'skipped':
      return <IconCircleX className="h-4 w-4 text-red-600" />
    default:
      return <IconClock className="h-4 w-4 text-gray-500" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
    case 'skipped':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
  }
}

export function RouteDataTable({ data, onUpdateStatus }: RouteDataTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  const columns: ColumnDef<TodaysRoute>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'estimatedTime',
      header: 'Time',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-mono text-sm font-semibold text-blue-700 dark:text-blue-300">
          <IconClock className="h-4 w-4" />
          {row.original.estimatedTime}
        </div>
      ),
    },
    {
      accessorKey: 'client.name',
      header: 'Client',
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="font-medium text-foreground truncate">
            {row.original.client.name}
          </div>
          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
            <IconMapPin className="h-3 w-3" />
            {row.original.client.address.street}, {row.original.client.address.city}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'pools',
      header: 'Pools',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-700">
          🏊‍♀️ {row.original.pools}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge 
          variant="outline" 
          className={`gap-1 ${getStatusColor(row.original.status)}`}
        >
          {getStatusIcon(row.original.status)}
          {row.original.status.replace('-', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const visit = row.original
        
        return (
          <div className="flex items-center gap-1">
            {visit.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus(visit.client._id, 'in-progress')}
                  className="h-7 px-2 text-blue-700 border-blue-200 hover:bg-blue-50 dark:text-blue-300 dark:border-blue-700"
                >
                  Start
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus(visit.client._id, 'skipped')}
                  className="h-7 px-2 text-gray-700 border-gray-200 hover:bg-gray-50"
                >
                  Skip
                </Button>
              </>
            )}
            
            {visit.status === 'in-progress' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const clientId = visit.client._id?.toString()
                  if (!clientId) {
                    alert('Invalid client ID')
                    return
                  }
                  router.push(`/visit/history?clientId=${clientId}&type=maintenance-routine`)
                }}
                className="h-7 px-2 text-green-700 border-green-200 hover:bg-green-50 dark:text-green-300 dark:border-green-700"
              >
                Log Visit
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `https://maps.google.com?q=${encodeURIComponent(
                    visit.client.address.street +
                      ', ' +
                      visit.client.address.city +
                      ', ' +
                      visit.client.address.state
                  )}`,
                  '_blank'
                )
              }
              className="h-7 px-2 text-blue-700 border-blue-200 hover:bg-blue-50 dark:text-blue-300 dark:border-blue-700"
            >
              <IconMapPin className="h-3 w-3" />
              Navigate
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">🏖️</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No visits scheduled</h3>
        <p className="text-muted-foreground">Enjoy your day off or check for emergency calls.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search visits..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Columns <IconChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="overflow-hidden rounded-lg border border-blue-100 dark:border-blue-800">
        <Table>
          <TableHeader className="bg-blue-50/50 dark:bg-blue-900/20">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-blue-900 dark:text-blue-100 font-semibold">
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
                  className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between px-2">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} visit(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <Label htmlFor='rows-per-page' className="text-sm font-medium">
              Visits per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]" id='rows-per-page'>
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}