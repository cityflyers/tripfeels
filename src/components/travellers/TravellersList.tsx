'use client'

import {
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  Award,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SimpleDropdown } from '@/components/ui/simple-dropdown'

export interface Traveller {
  id: string
  ptc: string
  givenName: string
  surname: string
  gender: string
  birthdate: string
  nationality: string
  phoneNumber: string
  countryDialingCode: string
  emailAddress: string
  documentType: string
  documentId: string
  documentExpiryDate: string
  ssrCodes: string[]
  ssrRemarks: Record<string, string | undefined>
  loyaltyAirlineCode: string
  loyaltyAccountNumber: string
  createdBy: string
  createdAt: string
  lastModified: string
}

interface TravellersListProps {
  travellers: Traveller[]
  role: string
  canDelete?: boolean
  onAddTraveller: () => void
  onEditTraveller: (id: string) => void
  onDeleteTraveller?: (id: string) => void
  onRefresh: () => void
  isLoading: boolean
  showEditForm?: boolean
  setShowEditForm?: (show: boolean) => void
  editingTraveller?: Traveller | null
  setEditingTraveller?: (traveller: Traveller | null) => void
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

const parseDisplayDate = (value: string | undefined | null): Date | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(trimmed)
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1])
    const month = Number(dateOnlyMatch[2])
    const day = Number(dateOnlyMatch[3])
    if (!year || !month || !day) return null
    return new Date(year, month - 1, day)
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

const formatDate = (value: string | undefined | null): string => {
  const parsed = parseDisplayDate(value)
  if (!parsed) return '--'

  const day = parsed.getDate()
  const month = parsed.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const year = parsed.getFullYear()
  return `${day} ${month} ${year}`
}

const formatDateTime = (value: string | undefined | null): string => {
  const parsed = parseDisplayDate(value)
  if (!parsed) return '--'

  const date = formatDate(value)
  const time = parsed.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${date} ${time}`
}

const safeText = (value: string | undefined | null, fallback: string = '--'): string => {
  if (!value) return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

const getRoleDescription = (role: string) => {
  switch (role) {
    case 'SuperAdmin':
      return 'Manage all travellers in the system. You can view, add, edit, and delete any traveller.'
    case 'Admin':
      return 'Manage all travellers in the system. You can view, add, edit, and delete any traveller.'
    case 'Staff':
    case 'Agent':
    case 'Partner':
    case 'User':
      return 'Manage your travellers. You can view, add, and edit only travellers you created.'
    default:
      return 'Manage travellers.'
  }
}

const getPtcBadgeClass = (ptc: string) => {
  switch (ptc) {
    case 'Adult':
      return 'bg-primary/10 text-primary border-primary/40'
    case 'Child':
      return 'bg-[var(--tf-info)]/15 text-[var(--tf-info)] border-[var(--tf-info)]/45'
    case 'Infant':
      return 'bg-[var(--tf-success)]/15 text-[var(--tf-success)] border-[var(--tf-success)]/45'
    default:
      return 'bg-[var(--tf-component-bg)] text-[var(--tf-text-primary)] border-[var(--tf-border)]'
  }
}

function TravellerSkeletonRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }, (_, idx) => (
        <Card
          key={idx}
          className="bg-[var(--tf-component-bg)] border border-[var(--tf-border)] shadow-sm"
        >
          <CardContent className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="h-5 w-44 rounded bg-[var(--tf-surface)]" />
                <div className="h-8 w-28 rounded bg-[var(--tf-surface)]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                <div className="h-10 rounded bg-[var(--tf-surface)]" />
                <div className="h-10 rounded bg-[var(--tf-surface)]" />
                <div className="h-10 rounded bg-[var(--tf-surface)]" />
                <div className="h-10 rounded bg-[var(--tf-surface)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function TravellersList({
  travellers,
  role,
  canDelete = false,
  onAddTraveller,
  onEditTraveller,
  onDeleteTraveller,
  onRefresh,
  isLoading,
  showEditForm: _showEditForm,
  setShowEditForm: _setShowEditForm,
  editingTraveller: _editingTraveller,
  setEditingTraveller: _setEditingTraveller,
}: TravellersListProps) {
  const [search, setSearch] = useState('')
  const [ptcFilter, setPtcFilter] = useState('All')
  const [nationalityFilter, setNationalityFilter] = useState('All')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const nationalityOptions = useMemo(() => {
    const all = Array.from(new Set(travellers.map((t) => safeText(t.nationality, '')).filter(Boolean)))
      .sort()
      .map((code) => ({ value: code, label: code }))
    return [{ value: 'All', label: 'All Countries' }, ...all]
  }, [travellers])

  const filteredTravellers = useMemo(
    () =>
      travellers.filter((traveller) => {
        const fullName = `${traveller.givenName} ${traveller.surname}`.toLowerCase()
        const q = search.trim().toLowerCase()
        const matchesSearch =
          !q ||
          fullName.includes(q) ||
          safeText(traveller.emailAddress, '').toLowerCase().includes(q) ||
          safeText(traveller.documentId, '').toLowerCase().includes(q)

        const matchesPtc = ptcFilter === 'All' || traveller.ptc === ptcFilter
        const matchesNationality =
          nationalityFilter === 'All' || safeText(traveller.nationality, '') === nationalityFilter

        return matchesSearch && matchesPtc && matchesNationality
      }),
    [travellers, search, ptcFilter, nationalityFilter],
  )

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="px-2 md:px-3 pt-2 space-y-3">
      <div className="rounded-xl border border-[var(--tf-border)] bg-[var(--tf-component-bg)] backdrop-blur-md shadow-sm p-4">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--tf-text-primary)]">Travellers Management</h1>
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200 disabled:opacity-50"
                title="Refresh travellers data"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="mt-1 text-sm text-[var(--tf-text-secondary)]">{getRoleDescription(role)}</p>
          </div>

          <Button onClick={onAddTraveller} className="h-10 px-4 flex items-center gap-2 self-start">
            <Plus className="h-4 w-4" />
            Add Traveller
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--tf-border)] bg-[var(--tf-component-bg)] backdrop-blur-md shadow-sm p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_170px_190px] gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tf-text-muted)] h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by name, email, or document ID"
              className="pl-9 h-10 w-full bg-[var(--tf-surface-alt)] border-[var(--tf-border)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <SimpleDropdown
            id="ptc-filter"
            value={ptcFilter}
            options={[
              { value: 'All', label: 'All PTC' },
              { value: 'Adult', label: 'Adult' },
              { value: 'Child', label: 'Child' },
              { value: 'Infant', label: 'Infant' },
            ]}
            onChange={setPtcFilter}
          />
          <SimpleDropdown
            id="nationality-filter"
            value={nationalityFilter}
            options={nationalityOptions}
            onChange={setNationalityFilter}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--tf-text-secondary)]">
          Showing {filteredTravellers.length} of {travellers.length} travellers
        </p>
      </div>

      {isLoading && travellers.length === 0 ? (
        <TravellerSkeletonRows />
      ) : filteredTravellers.length === 0 ? (
        <Card className="bg-[var(--tf-component-bg)] backdrop-blur-md border border-[var(--tf-border)]">
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-[var(--tf-text-muted)] mx-auto mb-3" />
            <h3 className="text-lg font-medium text-[var(--tf-text-primary)]">No travellers found</h3>
            <p className="text-[var(--tf-text-secondary)] mt-1">
              {search || ptcFilter !== 'All' || nationalityFilter !== 'All'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first traveller'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTravellers.map((traveller) => {
            const fullName = `${traveller.givenName} ${traveller.surname}`.trim()
            const createdAt = formatDateTime(traveller.createdAt)
            const modifiedAt = formatDateTime(traveller.lastModified)

            return (
              <Card
                key={traveller.id}
                className="bg-[var(--tf-component-bg)] backdrop-blur-md border border-[var(--tf-border)] shadow-sm hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-3">
                  <div className="flex flex-col 2xl:flex-row 2xl:items-center gap-3">
                    <div className="min-w-0 flex-1 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-[var(--tf-text-primary)] truncate">
                            {fullName || '--'}
                          </h3>
                          <div className="mt-0.5 flex items-center flex-wrap gap-2 text-sm text-[var(--tf-text-secondary)]">
                            <Badge
                              variant="outline"
                              className={`text-[11px] px-2 py-0 ${getPtcBadgeClass(traveller.ptc)}`}
                            >
                              {safeText(traveller.ptc, 'N/A')}
                            </Badge>
                            <span>{safeText(traveller.gender)}</span>
                            <span className="text-[var(--tf-text-muted)]">|</span>
                            <span>{safeText(traveller.nationality)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                        <div className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-component-bg)] px-2.5 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-[var(--tf-text-muted)]">Date of Birth</p>
                          <p className="mt-0.5 text-sm font-medium text-[var(--tf-text-primary)] flex items-center gap-1.5 truncate">
                            <Calendar className="h-3.5 w-3.5 text-primary/80" />
                            {formatDate(traveller.birthdate)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-component-bg)] px-2.5 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-[var(--tf-text-muted)]">Phone</p>
                          <p className="mt-0.5 text-sm font-medium text-[var(--tf-text-primary)] flex items-center gap-1.5 truncate">
                            <Phone className="h-3.5 w-3.5 text-primary/80" />+{safeText(traveller.countryDialingCode, '--')}{' '}
                            {safeText(traveller.phoneNumber)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-component-bg)] px-2.5 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-[var(--tf-text-muted)]">Email</p>
                          <p className="mt-0.5 text-sm font-medium text-[var(--tf-text-primary)] flex items-center gap-1.5 truncate">
                            <Mail className="h-3.5 w-3.5 text-primary/80" />
                            {safeText(traveller.emailAddress)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-component-bg)] px-2.5 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-[var(--tf-text-muted)]">
                            {safeText(traveller.documentType, 'Document')}
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-[var(--tf-text-primary)] flex items-center gap-1.5 truncate">
                            <FileText className="h-3.5 w-3.5 text-primary/80" />
                            {safeText(traveller.documentId)}
                          </p>
                          <p className="mt-1 text-xs text-[var(--tf-text-muted)] truncate">
                            Expires: {formatDate(traveller.documentExpiryDate)}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-[var(--tf-text-muted)]">
                        Created by {safeText(traveller.createdBy)} on {createdAt}
                        {modifiedAt !== createdAt && <span> | Last modified: {modifiedAt}</span>}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 2xl:flex-col 2xl:items-stretch 2xl:w-[128px]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditTraveller(traveller.id)}
                        className="h-8 border-[hsl(var(--primary))]/60 text-primary hover:bg-primary/10"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>

                      {canDelete && onDeleteTraveller && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteTraveller(traveller.id)}
                          className="h-8 border-[hsl(var(--primary))]/60 text-primary hover:bg-primary/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpanded(traveller.id)}
                        className="h-8 border-[hsl(var(--primary))]/60 text-primary hover:bg-primary/10"
                      >
                        <ChevronDown
                          className={`h-3.5 w-3.5 mr-1 transition-transform ${expanded[traveller.id] ? 'rotate-180' : ''}`}
                        />
                        {expanded[traveller.id] ? 'Less' : 'Details'}
                      </Button>
                    </div>
                  </div>

                  {expanded[traveller.id] && (
                    <div className="mt-3 pt-3 border-t border-[var(--tf-border)] grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-component-bg)] p-3">
                        <p className="font-semibold text-[var(--tf-text-primary)] mb-2">Contact</p>
                        <p className="text-[var(--tf-text-secondary)]">Phone: +{safeText(traveller.countryDialingCode, '--')} {safeText(traveller.phoneNumber)}</p>
                        <p className="text-[var(--tf-text-secondary)]">Email: {safeText(traveller.emailAddress)}</p>
                      </div>

                      <div className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-component-bg)] p-3">
                        <p className="font-semibold text-[var(--tf-text-primary)] mb-2">Identity</p>
                        <p className="text-[var(--tf-text-secondary)]">
                          {safeText(traveller.documentType)}: {safeText(traveller.documentId)}
                        </p>
                        <p className="text-[var(--tf-text-secondary)]">
                          Expiry: {formatDate(traveller.documentExpiryDate)}
                        </p>
                      </div>

                      <div className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-component-bg)] p-3">
                        <p className="font-semibold text-[var(--tf-text-primary)] mb-2">Personal</p>
                        <p className="text-[var(--tf-text-secondary)]">DOB: {formatDate(traveller.birthdate)}</p>
                        <p className="text-[var(--tf-text-secondary)]">
                          Nationality: {safeText(traveller.nationality)}
                        </p>
                      </div>

                      {traveller.loyaltyAirlineCode && (
                        <div className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-component-bg)] p-3 lg:col-span-3">
                          <p className="font-semibold text-[var(--tf-text-primary)] mb-2 flex items-center gap-1.5">
                            <Award className="h-4 w-4 text-primary/80" />
                            Loyalty
                          </p>
                          <p className="text-[var(--tf-text-secondary)]">
                            {safeText(traveller.loyaltyAirlineCode)} - {safeText(traveller.loyaltyAccountNumber)}
                          </p>
                        </div>
                      )}

                      {traveller.ssrCodes.length > 0 && (
                        <div className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-component-bg)] p-3 lg:col-span-3">
                          <p className="font-semibold text-[var(--tf-text-primary)] mb-2">SSR</p>
                          <div className="flex flex-wrap gap-1.5">
                            {traveller.ssrCodes.map((code) => (
                              <Badge
                                key={code}
                                variant="outline"
                                className="text-xs text-[var(--tf-text-primary)] border-[var(--tf-border)] bg-[var(--tf-component-bg)]"
                              >
                                {code}
                                {traveller.ssrRemarks[code] && `: ${traveller.ssrRemarks[code]}`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
