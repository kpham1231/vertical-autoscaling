import { useMemo, useState } from 'react'
import { useToast } from '@leafygreen-ui/toast'
import { css } from '@leafygreen-ui/emotion'
import { palette } from '@leafygreen-ui/palette'
import { color, spacing } from '@leafygreen-ui/tokens'
import { Body, Link, H3 } from '@leafygreen-ui/typography'
import Button from '@leafygreen-ui/button'
import Badge from '@leafygreen-ui/badge'
import Card from '@leafygreen-ui/card'
import { IconButton } from '@leafygreen-ui/icon-button'
import Icon from '@leafygreen-ui/icon'
import { Menu, MenuItem } from '@leafygreen-ui/menu'
import { PageLoader } from '@leafygreen-ui/loading-indicator'
import Modal from '@leafygreen-ui/modal'
import { DatePicker } from '@leafygreen-ui/date-picker'
import Checkbox from '@leafygreen-ui/checkbox'
import { Toggle } from '@leafygreen-ui/toggle'
import TextInput from '@leafygreen-ui/text-input'
import { Select, Option } from '@leafygreen-ui/select'
import {
  Table,
  TableHead,
  TableBody,
  HeaderRow,
  HeaderCell,
  Row,
  Cell,
  useLeafyGreenTable,
  type LGColumnDef,
} from '@leafygreen-ui/table'

const TIER_OPTIONS = [
  { value: 'SP2',  label: 'SP2',  description: 'For development environments.',                                        price: '$0.06/hr' },
  { value: 'SP5',  label: 'SP5',  description: 'For minimal complexity processors.',                                   price: '$0.11/hr' },
  { value: 'SP10', label: 'SP10', description: 'For development environments and low-traffic applications.',           price: '$0.19/hr' },
  { value: 'SP30', label: 'SP30', description: 'For moderate complexity and medium-traffic processors.',               price: '$0.39/hr' },
  { value: 'SP50', label: 'SP50', description: 'For high-traffic processors and heavy aggregations.',                  price: '$1.56/hr' },
]

export type ProcessorStatus = 'RUNNING' | 'STOPPED' | 'FAILED' | 'BACKING UP'

export interface StreamProcessor {
  name: string
  status: ProcessorStatus
  currentTier: string
  autoscalingEnabled?: boolean
  failoverEnabled?: boolean
  isDefaultRegion?: boolean
  subRows?: StreamProcessor[]
}

const pageStyles = css`
  flex: 1;
  padding: ${spacing[600]}px ${spacing[1000]}px;
  background: ${palette.white};
  min-height: 0;
  overflow-y: auto;
  position: relative;
`

const cardStyles = css`
  border-color: ${palette.gray.light2} !important;
  height: 400px;
`

const pageHeaderStyles = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${spacing[400]}px;
`

const headingStyles = css`
  font-family: 'MongoDB Value Serif', Georgia, serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 40px;
  color: ${palette.black};
  margin: 0 0 ${spacing[100]}px 0;
`

const subtitleStyles = css`
  display: flex;
  align-items: center;
  gap: ${spacing[150]}px;
  color: ${palette.gray.dark1};
`

const headerActionsStyles = css`
  display: flex;
  align-items: center;
  gap: ${spacing[200]}px;
  margin-top: ${spacing[100]}px;
`

const statusBadgeWrapperStyles = css`
  display: flex;
  align-items: center;
  gap: 10px;
`

const actionsStyles = css`
  display: flex;
  align-items: center;
  gap: ${spacing[100]}px;
`

const hoverRowStyles = css`
  cursor: pointer;
  border-radius: 8px;
  outline: 3px solid transparent;
  outline-offset: -2px;
  transition: outline-color 0.15s ease;
  &:hover {
    outline-color: ${color.light.border.secondary.default};
  }
`

const statusVariant: Partial<Record<ProcessorStatus, 'green' | 'lightgray' | 'red'>> = {
  RUNNING: 'green',
  STOPPED: 'lightgray',
  FAILED: 'red',
}


const defaultData: StreamProcessor[] = [
  { name: 'spTest', status: 'RUNNING', currentTier: 'SP30' },
]

const sectionDividerStyles = css`
  border: none;
  border-top: 1px solid ${color.light.border.secondary.default};
  margin: ${spacing[600]}px 0;
`

function AdvancedStartModal({ open, onClose, currentTier, processorName: _processorName, onConfirm }: { open: boolean; onClose: () => void; currentTier: string; processorName: string; onConfirm: (newTier: string | null) => void }) {
  const [clearCheckpoint, setClearCheckpoint] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [timeValue, setTimeValue] = useState('')
  const [amPm, setAmPm] = useState('AM')
  const [newTier, setNewTier] = useState('')
  const [startAfterCreation, setStartAfterCreation] = useState(true)
  const [minTier, setMinTier] = useState('SP10')
  const [maxTier, setMaxTier] = useState('SP30')
  const [startingTier, setStartingTier] = useState('')
  const [isStarting, setIsStarting] = useState(false)

  const hasChanges = clearCheckpoint || selectedDate !== null || timeValue.trim() !== '' || newTier !== ''

  const handleClose = () => {
    setClearCheckpoint(false)
    setSelectedDate(null)
    setTimeValue('')
    setAmPm('AM')
    setNewTier('')
    setStartAfterCreation(true)
    setMinTier('SP10')
    setMaxTier('SP30')
    setStartingTier('')
    setIsStarting(false)
    onClose()
  }

  const handleStart = () => {
    setIsStarting(true)
    setTimeout(() => {
      handleClose()
      onConfirm(newTier || null)
    }, 1000)
  }

  return (
    <Modal open={open} setOpen={(v) => { if (!v && !isStarting) handleClose() }} size="default">
      {isStarting ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
          <PageLoader description="Starting processor..." />
        </div>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <H3 style={{ marginBottom: 8 }}>startWith options</H3>
        <Body baseFontSize={13} style={{ marginBottom: 24 }}>
          To understand the different startWith operations, view our{' '}
          <Link href="#">documentation<Icon glyph="OpenNewTab" size="small" style={{ marginLeft: 2 }} /></Link>.
        </Body>

        {/* resumeFromCheckpoint */}
        <Body baseFontSize={16} style={{ display: 'block', marginBottom: 12 }}>resumeFromCheckpoint</Body>
        <Checkbox
          label="Clear checkpoint"
          description="Clearing the checkpoint may cause duplicate or missing records in your output collection."
          checked={clearCheckpoint}
          onChange={(e) => setClearCheckpoint(e.target.checked)}
          darkMode={false}
        />

        <hr className={sectionDividerStyles} />

        {/* startAtOperationTime */}
        <Body baseFontSize={16} style={{ display: 'block', marginBottom: 8 }}>startAtOperationTime</Body>
        <Body baseFontSize={13} style={{ marginBottom: 16, color: color.light.text.secondary.default }}>
          The operation time after which the change stream source should begin reporting. This parameter expresses its value in the ISO 8601 timestamp format in UTC.
        </Body>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <DatePicker
              label="Date"
              value={selectedDate}
              onDateChange={(d) => setSelectedDate(d as Date | null)}
              locale="en-US"
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TextInput
                  label={<span>Time <span style={{ color: color.light.text.secondary.default, fontWeight: 400 }}>(UTC)</span></span> as any}
                  aria-label="Operation time"
                  placeholder="HH:MM:SS"
                  value={timeValue}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                    let formatted = digits
                    if (digits.length > 4) formatted = digits.slice(0, 2) + ':' + digits.slice(2, 4) + ':' + digits.slice(4)
                    else if (digits.length > 2) formatted = digits.slice(0, 2) + ':' + digits.slice(2)
                    setTimeValue(formatted)
                  }}
                />
              </div>
              <div style={{ width: 68, flexShrink: 0 }}>
                <Select label="" aria-label="AM or PM" value={amPm} onChange={setAmPm}>
                  <Option value="AM">AM</Option>
                  <Option value="PM">PM</Option>
                </Select>
              </div>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: color.light.text.secondary.default, background: 'transparent' }}>
              UTC Time: HH:MM:SS AM or PM (UTC)
            </p>
          </div>
        </div>

        <hr className={sectionDividerStyles} />

        {/* Tier configuration */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Body baseFontSize={16}>Tier configuration</Body>
          <Badge variant="lightgray">current tier : {currentTier}</Badge>
        </div>
        <div style={{
          background: color.light.background.secondary.default,
          border: `1px solid ${color.light.border.secondary.default}`,
          borderRadius: 12,
          padding: spacing[400],
          marginBottom: spacing[400],
        }}>
          <Body baseFontSize={13} style={{ fontWeight: 700, display: 'block', marginBottom: spacing[200] }}>Autoscaling</Body>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[300] }}>
            <Toggle
              checked={startAfterCreation}
              onChange={(checked) => setStartAfterCreation(checked)}
              aria-label="Enable autoscaling"
              size="small"
              darkMode={false}
            />
            <Body baseFontSize={13}>
              Enable stream processor to automatically change tiers based on resource usage without human operators.{' '}
              <Link href="#">View docs.</Link>
            </Body>
          </div>
        </div>

        {startAfterCreation ? (
          <>
          <div style={{ display: 'flex', gap: spacing[400] }}>
            <div style={{ flex: 1 }}>
              <Select
                label="Minimum tier"
                description="The lowest tier the stream processor can auto-scale down to."
                value={minTier}
                onChange={setMinTier}
              >
                {TIER_OPTIONS.map(t => (
                  <Option key={t.value} value={t.value} description={t.description}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span>{t.label}</span>
                      <span data-tier-price style={{ color: palette.gray.dark1 }}>{t.price}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
            <div style={{ flex: 1 }}>
              <Select
                label="Maximum tier"
                description="The highest tier the stream processor can auto-scale up to."
                value={maxTier}
                onChange={setMaxTier}
              >
                {TIER_OPTIONS.map(t => (
                  <Option key={t.value} value={t.value} description={t.description}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span>{t.label}</span>
                      <span data-tier-price style={{ color: palette.gray.dark1 }}>{t.price}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </div>
          <div style={{ marginTop: spacing[400] }}>
            <Select
              label="Starting tier"
              description="The tier the stream processor will start at once autoscaling initiates."
              value={startingTier}
              onChange={setStartingTier}
            >
              {TIER_OPTIONS.map(t => (
                <Option key={t.value} value={t.value} description={t.description}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span>{t.label}</span>
                    <span data-tier-price style={{ color: palette.gray.dark1 }}>{t.price}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          </>
        ) : (
          <>
            <Body baseFontSize={13} style={{ fontWeight: 700, display: 'block', marginBottom: 8 }}>New tier</Body>
            <Select label="" aria-label="New tier" placeholder="Select a tier" value={newTier} onChange={setNewTier}>
              {TIER_OPTIONS.filter(t => t.value !== currentTier).map(t => (
                <Option key={t.value} value={t.value} description={t.description}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span>{t.label}</span>
                    <span data-tier-price style={{ color: palette.gray.dark1 }}>{t.price}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 32 }}>
          <Button variant="default" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" disabled={!hasChanges} onClick={handleStart}>Start processor</Button>
        </div>
      </div>
      )}
    </Modal>
  )
}

function ActionsCell({
  status,
  onStart,
  onStop,
  onDelete,
  onAdvancedStart,
}: {
  status: ProcessorStatus
  onStart: () => void
  onStop: () => void
  onDelete: () => void
  onAdvancedStart: () => void
}) {
  return (
    <div className={actionsStyles} onClick={e => e.stopPropagation()}>
      <IconButton
        aria-label="Start"
        disabled={status === 'RUNNING'}
        onClick={onStart}
      >
        <Icon glyph="Play" />
      </IconButton>
      <IconButton
        aria-label="Stop"
        disabled={status !== 'RUNNING'}
        onClick={onStop}
      >
        <Icon glyph="Stop" />
      </IconButton>
      <Menu
        trigger={
          <IconButton aria-label="More options">
            <Icon glyph="Ellipsis" />
          </IconButton>
        }
        darkMode={false}
        spacing={2}
      >
        <MenuItem
          disabled={status === 'RUNNING'}
          description={status === 'RUNNING' ? 'Processor must be stopped before configuring.' : undefined}
          onClick={onAdvancedStart}
        >
          startWith options
        </MenuItem>
        <MenuItem
          variant="destructive"
          disabled={status === 'RUNNING'}
          description={status === 'RUNNING' ? 'Processor must be stopped before deleting.' : undefined}
          onClick={onDelete}
        >
          Delete stream processor
        </MenuItem>
      </Menu>
    </div>
  )
}

export function StreamProcessorsPage({
  onCreateClick,
  processors = defaultData,
  onRowClick,
  onStatusChange,
  onDeleteProcessor,
  onTierChange,
}: {
  onCreateClick: () => void
  processors?: StreamProcessor[]
  onRowClick?: (processor: StreamProcessor) => void
  onStatusChange?: (name: string, status: ProcessorStatus) => void
  onDeleteProcessor?: (name: string) => void
  onTierChange?: (name: string, tier: string) => void
}) {
  const { pushToast } = useToast()
  const [isLoadingCreate, setIsLoadingCreate] = useState(false)
  const [advancedStartOpen, setAdvancedStartOpen] = useState(false)
  const [advancedStartTier, setAdvancedStartTier] = useState('SP10')
  const [advancedStartProcessorName, setAdvancedStartProcessorName] = useState('')

  const columns = useMemo<LGColumnDef<StreamProcessor>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Stream Processor Name',
      size: 300,
      cell: (info) => {
        const processor = info.row.original
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{processor.name}</span>
            {processor.isDefaultRegion && (
              <Badge variant="darkgray">DEFAULT</Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 280,
      cell: (info) => {
        const status = info.getValue<ProcessorStatus>()
        const isSubRow = info.row.depth > 0
        if (status === 'BACKING UP') {
          return (
            <div className={statusBadgeWrapperStyles}>
              <Badge variant="purple">BACKING UP</Badge>
            </div>
          )
        }
        return (
          <div className={statusBadgeWrapperStyles}>
            <Badge variant={statusVariant[status] ?? 'lightgray'}>{status}</Badge>
            {!isSubRow && <Link href="#">View monitoring</Link>}
          </div>
        )
      },
    },
    {
      accessorKey: 'currentTier',
      header: 'Current tier',
      size: 200,
      cell: (info) => {
        if (info.row.depth > 0) return null
        const processor = info.row.original
        return (
          <span>
            {info.getValue() as string}
            {processor.autoscalingEnabled && (
              <span style={{ color: color.light.text.secondary.default }}> (Autoscaling)</span>
            )}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 180,
      cell: (info) => {
        const processor = info.row.original
        const depth = info.row.depth

        // Sub-row: default region → play/stop; backup region → FAILOVER button
        if (depth > 0) {
          if (processor.isDefaultRegion) {
            const parentName = info.row.getParentRow()?.original.name ?? ''
            return (
              <div className={actionsStyles} onClick={e => e.stopPropagation()}>
                <IconButton aria-label="Start" disabled={processor.status === 'RUNNING'} onClick={() => onStatusChange?.(parentName, 'RUNNING')}>
                  <Icon glyph="Play" />
                </IconButton>
                <IconButton aria-label="Stop" disabled={processor.status !== 'RUNNING'} onClick={() => onStatusChange?.(parentName, 'STOPPED')}>
                  <Icon glyph="Stop" />
                </IconButton>
              </div>
            )
          }
          return (
            <div onClick={e => e.stopPropagation()}>
              <Button variant="default" size="xsmall">FAILOVER</Button>
            </div>
          )
        }

        // Parent row with failover: ellipsis menu only (no play/stop)
        if (processor.failoverEnabled) {
          return (
            <div className={actionsStyles} onClick={e => e.stopPropagation()}>
              <Menu
                trigger={<IconButton aria-label="More options"><Icon glyph="Ellipsis" /></IconButton>}
                darkMode={false}
                spacing={2}
              >
                <MenuItem
                  disabled={processor.status === 'RUNNING'}
                  description={processor.status === 'RUNNING' ? 'Processor must be stopped before configuring.' : undefined}
                  onClick={() => { setAdvancedStartTier(processor.currentTier); setAdvancedStartProcessorName(processor.name); setAdvancedStartOpen(true) }}
                >
                  startWith options
                </MenuItem>
                <MenuItem
                  variant="destructive"
                  disabled={processor.status === 'RUNNING'}
                  description={processor.status === 'RUNNING' ? 'Processor must be stopped before deleting.' : undefined}
                  onClick={() => onDeleteProcessor?.(processor.name)}
                >
                  Delete stream processor
                </MenuItem>
              </Menu>
            </div>
          )
        }

        // Normal parent row: full actions
        return (
          <ActionsCell
            status={processor.status}
            onStart={() => onStatusChange?.(processor.name, 'RUNNING')}
            onStop={() => onStatusChange?.(processor.name, 'STOPPED')}
            onDelete={() => onDeleteProcessor?.(processor.name)}
            onAdvancedStart={() => { setAdvancedStartTier(processor.currentTier); setAdvancedStartProcessorName(processor.name); setAdvancedStartOpen(true) }}
          />
        )
      },
    },
  ], [onStatusChange, onDeleteProcessor])

  const data = useMemo(() => processors.map(p =>
    p.failoverEnabled
      ? {
          ...p,
          subRows: [
            { name: 'us-east-1', status: p.status, currentTier: p.currentTier, isDefaultRegion: true },
            { name: 'us-west-2', status: 'BACKING UP' as ProcessorStatus, currentTier: p.currentTier },
            { name: 'ca-central-1', status: 'BACKING UP' as ProcessorStatus, currentTier: p.currentTier },
          ],
        }
      : p
  ), [processors])

  const handleCreateClick = () => {
    setIsLoadingCreate(true)
    setTimeout(() => {
      setIsLoadingCreate(false)
      onCreateClick()
    }, 1800)
  }

  const table = useLeafyGreenTable<StreamProcessor>({
    data,
    columns,
  })

  const { rows } = table.getRowModel()

  return (
    <div className={pageStyles}>
      {isLoadingCreate && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: palette.white,
          zIndex: 100,
        }}>
          <PageLoader description="Loading processor builder..." />
        </div>
      )}
      <div className={pageHeaderStyles}>
        <div>
          <h1 className={headingStyles}>Stream Processors</h1>
          <div className={subtitleStyles}>
            <Icon glyph="ShardedCluster" size="small" />
            <Body>wksp1</Body>
          </div>
        </div>
        <div className={headerActionsStyles}>
          <Button variant="default">Connect</Button>
          <Button variant="primary" leftGlyph={<Icon glyph="Plus" />} onClick={handleCreateClick}>
            Create stream processor
          </Button>
        </div>
      </div>

      <AdvancedStartModal
        open={advancedStartOpen}
        onClose={() => setAdvancedStartOpen(false)}
        currentTier={advancedStartTier}
        processorName={advancedStartProcessorName}
        onConfirm={(selectedTier) => {
          onStatusChange?.(advancedStartProcessorName, 'RUNNING')
          if (selectedTier) onTierChange?.(advancedStartProcessorName, selectedTier)
          pushToast({
            variant: 'success',
            title: `"${advancedStartProcessorName}" started successfully.`,
            timeout: 6000,
          })
        }}
      />

      <Card className={cardStyles}>
        <Table table={table}>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <HeaderRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <HeaderCell key={header.id} header={header}>
                    {header.isPlaceholder ? null : (header.column.columnDef.header as string)}
                  </HeaderCell>
                ))}
              </HeaderRow>
            ))}
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <Row key={row.id} row={row} className={row.depth === 0 ? hoverRowStyles : undefined} onClick={row.depth === 0 ? (e) => {
                if ((e.target as HTMLElement).closest('button[aria-label="Expand row"], button[aria-label="Collapse row"]')) return
                onRowClick?.(row.original)
              } : undefined} style={{ cursor: row.depth === 0 ? 'pointer' : 'default' }}>
                {row.getVisibleCells().map((cell) => (
                  <Cell key={cell.id} cell={cell}>
                    {cell.column.columnDef.cell
                      ? (cell.column.columnDef.cell as Function)(cell.getContext())
                      : cell.getValue() as string}
                  </Cell>
                ))}
              </Row>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
