import { useState, useRef } from 'react'
import { css } from '@leafygreen-ui/emotion'
import { palette } from '@leafygreen-ui/palette'
import { spacing, color } from '@leafygreen-ui/tokens'
import { Body, Link, Subtitle } from '@leafygreen-ui/typography'
import Button from '@leafygreen-ui/button'
import Icon from '@leafygreen-ui/icon'
import IconButton from '@leafygreen-ui/icon-button'
import { Combobox, ComboboxOption } from '@leafygreen-ui/combobox'
import Badge from '@leafygreen-ui/badge'
import { Select, Option } from '@leafygreen-ui/select'
import { DatePicker } from '@leafygreen-ui/date-picker'
import { Banner } from '@leafygreen-ui/banner'
import { Table, TableHead, TableBody, HeaderRow, HeaderCell, Row, Cell } from '@leafygreen-ui/table'
import { DndContext } from '@dnd-kit/core'
import { ChartCard } from '@lg-charts/chart-card'
import { Tooltip, TriggerEvent } from '@leafygreen-ui/tooltip'
import { Chart, Line, XAxis, YAxis } from '@lg-charts/core'
import { type StreamProcessor } from './StreamProcessorsPage'

const pageStyles = css`
  flex: 1;
  padding: ${spacing[600]}px ${spacing[1000]}px;
  background: ${palette.white};
  min-height: 0;
  overflow-y: auto;
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

const now = Date.now()
const MEMORY_MB_DATA: Array<[Date, number]> = Array.from({ length: 60 }, (_, i) => [
  new Date(now - (59 - i) * 60_000),
  i === 38 ? 90 : 10 + Math.sin(i / 8) * 5 + Math.random() * 4,
])
const CPU_PCT_DATA: Array<[Date, number]> = Array.from({ length: 60 }, (_, i) => [
  new Date(now - (59 - i) * 60_000),
  i === 38 ? 2.2 : 0.2 + Math.sin(i / 8) * 0.12 + Math.random() * 0.12,
])
const LATENCY_DATA: Array<[Date, number]> = Array.from({ length: 60 }, (_, i) => [
  new Date(now - (59 - i) * 60_000),
  50 + Math.cos(i / 6) * 20 + Math.random() * 15,
])


interface MonitoringPageProps {
  processors?: StreamProcessor[]
}

export function MonitoringPage({ processors = [] }: MonitoringPageProps) {
  const [selectedProcessor, setSelectedProcessor] = useState<string | null>(processors[0]?.name ?? null)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['memory', 'cpu'])
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [autoscalingOpen, setAutoscalingOpen] = useState(false)

  const autoscalingEnabled = processors.find(p => p.name === selectedProcessor)?.autoscalingEnabled ?? false

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [timeRange, setTimeRange] = useState('last-hour')
  const [filterDate, setFilterDate] = useState<Date | null>(new Date())
  const [granularity, setGranularity] = useState('auto')

  return (
    <div className={pageStyles}>
      <div className={pageHeaderStyles}>
        <div>
          <h1 className={headingStyles}>Metrics</h1>
          <div className={subtitleStyles}>
            <Icon glyph="ShardedCluster" size="small" />
            <Body>wksp1</Body>
          </div>
        </div>
        <div className={headerActionsStyles}>
          <Button variant="default">Connect</Button>
        </div>
      </div>
      <div style={{ marginTop: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ width: 300 }}>
            <Combobox
              label="Stream processor"
              value={selectedProcessor}
              onChange={setSelectedProcessor}
              multiselect={false}
              darkMode={false}
            >
              {processors.map(p => (
                <ComboboxOption key={p.name} value={p.name} displayName={p.name} />
              ))}
            </Combobox>
          </div>
          {selectedProcessor && (() => {
            const proc = processors.find(p => p.name === selectedProcessor)
            if (!proc) return null
            const statusVariant = proc.status === 'RUNNING' ? 'green' : proc.status === 'STOPPED' ? 'red' : 'yellow'
            return <div style={{ paddingBottom: 9 }}><Badge variant={statusVariant}>{proc.status}</Badge></div>
          })()}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ width: 148 }}>
          <Select
            label="Time Range"
            value={timeRange}
            onChange={setTimeRange}
            size="small"
          >
            <Option value="last-hour">Last hour</Option>
            <Option value="last-6-hours">Last 6 hours</Option>
            <Option value="last-24-hours">Last 24 hours</Option>
            <Option value="last-7-days">Last 7 days</Option>
            <Option value="last-30-days">Last 30 days</Option>
          </Select>
          </div>
          <div style={{ width: 195 }}>
            <DatePicker
              label="Filter by Date and Time"
              value={filterDate}
              onDateChange={setFilterDate}
              size="small"
              darkMode={false}
            />
          </div>
          <div style={{ width: 148 }}>
          <Select
            label="Granularity"
            value={granularity}
            onChange={setGranularity}
            size="small"
          >
            <Option value="auto">Auto</Option>
            <Option value="1m">1 minute</Option>
            <Option value="5m">5 minutes</Option>
            <Option value="1h">1 hour</Option>
            <Option value="1d">1 day</Option>
          </Select>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 24, background: palette.gray.light3, borderRadius: 8, padding: '24px 0', display: 'flex', alignItems: 'stretch' }}>
        {/* Message rate */}
        <div style={{ flex: 'none', padding: '0 24px', borderRight: `1px solid ${color.light.border.secondary.default}` }}>
          <Body baseFontSize={13} style={{ color: color.light.text.primary.default, borderBottom: `1px dashed ${color.light.text.primary.default}`, display: 'inline-block', marginBottom: 16 }}>Message rate</Body>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
            <Subtitle>1024 msg/s</Subtitle>
            <Body baseFontSize={13} style={{ color: palette.gray.dark1 }}>In</Body>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <Subtitle>512 msg/s</Subtitle>
            <Body baseFontSize={13} style={{ color: palette.gray.dark1 }}>Out</Body>
          </div>
        </div>
        {/* Processor latency */}
        <div style={{ flex: 'none', padding: '0 24px', borderRight: `1px solid ${color.light.border.secondary.default}` }}>
          <Body baseFontSize={13} style={{ color: color.light.text.primary.default, borderBottom: `1px dashed ${color.light.text.primary.default}`, display: 'inline-block', marginBottom: 16 }}>Processor latency</Body>
          <Subtitle style={{ display: 'block', marginBottom: 12 }}>p50</Subtitle>
          <Body baseFontSize={13} style={{ color: palette.gray.dark1, fontStyle: 'italic' }}>5 min decay</Body>
        </div>
        {/* Source lag */}
        <div style={{ flex: 'none', padding: '0 24px', borderRight: `1px solid ${color.light.border.secondary.default}` }}>
          <Body baseFontSize={13} style={{ color: color.light.text.primary.default, borderBottom: `1px dashed ${color.light.text.primary.default}`, display: 'inline-block', marginBottom: 16 }}>Source lag</Body>
          <Subtitle style={{ display: 'block', marginBottom: 12 }}>100 ms</Subtitle>
          <Body baseFontSize={13} style={{ color: palette.gray.dark1, fontStyle: 'italic' }}>Change stream lag</Body>
        </div>
        {/* Latest checkpoint */}
        <div style={{ flex: 'none', padding: '0 24px', borderRight: `1px solid ${color.light.border.secondary.default}` }}>
          <Body baseFontSize={13} style={{ color: color.light.text.primary.default, borderBottom: `1px dashed ${color.light.text.primary.default}`, display: 'inline-block', marginBottom: 16 }}>Latest checkpoint</Body>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Subtitle>02/12/2025 11:12 AM</Subtitle>
            <Icon glyph="Copy" size="small" style={{ color: palette.gray.dark1, cursor: 'pointer' }} />
            <Icon glyph="CaretDown" size="small" style={{ color: palette.gray.dark1, cursor: 'pointer' }} />
          </div>
        </div>
        {/* Dead-letter queue */}
        <div style={{ flex: 'none', padding: '0 24px' }}>
          <Body baseFontSize={13} style={{ color: color.light.text.primary.default, borderBottom: `1px dashed ${color.light.text.primary.default}`, display: 'inline-block', marginBottom: 16 }}>Dead-letter queue</Body>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
            <Subtitle>5 messages</Subtitle>
            <Link href="#">View in collection</Link>
          </div>
          <Body baseFontSize={13} style={{ color: palette.gray.dark1, fontStyle: 'italic' }}>Latest activity: 02/12/2025 11:12:01 AM</Body>
        </div>
      </div>
      {autoscalingEnabled && <div style={{ marginTop: 16 }}>
        <ChartCard
          title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Autoscaling <Tooltip triggerEvent={TriggerEvent.Click} trigger={<span style={{ display: 'inline-flex', cursor: 'pointer' }}><Icon glyph="QuestionMarkWithCircle" style={{ color: color.light.icon.secondary.default }} /></span>}>Displays the current autoscaling tier configuration and history for this stream processor. Autoscaling automatically adjusts compute resources based on workload demands.</Tooltip></span>}
          isOpen={autoscalingOpen}
          onToggleButtonClick={() => setAutoscalingOpen(o => !o)}
        >
          <hr style={{ margin: 0, border: 'none', borderTop: `1px solid ${palette.gray.light1}` }} />
          <div style={{ padding: 16 }}>
          {!bannerDismissed && (
            <Banner
              variant="info"
              style={{ margin: '0 0 16px 0' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <span>You can edit the autoscaling configuration for this processor in the{' '}
                <strong>Stream Processors</strong> tab.</span>
                <Button size="xsmall" style={{ marginLeft: 'auto', flexShrink: 0 }}>Edit in Stream Processors</Button>
                <IconButton aria-label="Close" style={{ marginLeft: 12 }} onClick={() => setBannerDismissed(true)}>
                  <Icon glyph="X" />
                </IconButton>
              </span>
            </Banner>
          )}
          <Table>
            <TableHead>
              <HeaderRow>
                <HeaderCell>Current tier</HeaderCell>
                <HeaderCell>Desired (initial) tier</HeaderCell>
                <HeaderCell>Latest change</HeaderCell>
                <HeaderCell>Minimum / Maximum tier</HeaderCell>
              </HeaderRow>
            </TableHead>
            <TableBody>
              <Row>
                <Cell>SP15</Cell>
                <Cell>SP10</Cell>
                <Cell>02/12/2025 11:12:01 AM</Cell>
                <Cell>SP10 / SP30</Cell>
              </Row>
            </TableBody>
          </Table>
          </div>
        </ChartCard>
      </div>}
      <div style={{ marginTop: 16 }}>
        <ChartCard
          title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Memory/CPU <Tooltip triggerEvent={TriggerEvent.Click} trigger={<span style={{ display: 'inline-flex', cursor: 'pointer' }}><Icon glyph="QuestionMarkWithCircle" style={{ color: color.light.icon.secondary.default }} /></span>}>Shows real-time memory usage (MB) and CPU utilization (%) for the selected stream processor over the chosen time range.</Tooltip></span>}
          defaultOpen
          headerContent={
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <div style={{ width: 218 }}>
              <Combobox
                label=""
                placeholder="Select metric"
                multiselect
                size="small"
                darkMode={false}
                value={selectedMetrics}
                onChange={setSelectedMetrics}
              >
                <ComboboxOption value="memory" displayName="Memory" />
                <ComboboxOption value="cpu" displayName="CPU" />
              </Combobox>
            </div>
            </div>
          }
        >
          <DndContext>
            <hr style={{ margin: 0, border: 'none', borderTop: `1px solid ${palette.gray.light1}` }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, marginBottom: 4, paddingLeft: 12 }}>
              <Body style={{ color: color.light.text.primary.default }}>Memory (Mb)</Body>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IconButton aria-label="Expand"><Icon glyph="FullScreenEnter" style={{ color: color.light.icon.secondary.default }} /></IconButton>
                <IconButton aria-label="Close" style={{ marginRight: 4 }}><Icon glyph="X" style={{ color: color.light.icon.secondary.default }} /></IconButton>
              </div>
            </div>
            <hr style={{ margin: 0, border: 'none', borderTop: `1px solid ${palette.gray.light1}` }} />
            <Chart className={css`height: 128px !important;`}>
              <XAxis type="time" />
              <YAxis type="value" min={0} max={150} splitNumber={3} formatter={(v: number) => `${v}MB`} />
              <Line name="Memory" data={MEMORY_MB_DATA} />
            </Chart>
          </DndContext>
          <DndContext>
            <hr style={{ margin: 0, border: 'none', borderTop: `1px solid ${palette.gray.light1}` }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, marginBottom: 4, paddingLeft: 12 }}>
              <Body style={{ color: color.light.text.primary.default }}>CPU (%)</Body>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IconButton aria-label="Expand"><Icon glyph="FullScreenEnter" style={{ color: color.light.icon.secondary.default }} /></IconButton>
                <IconButton aria-label="Close" style={{ marginRight: 4 }}><Icon glyph="X" style={{ color: color.light.icon.secondary.default }} /></IconButton>
              </div>
            </div>
            <hr style={{ margin: 0, border: 'none', borderTop: `1px solid ${palette.gray.light1}` }} />
            <Chart className={css`height: 128px !important;`}>
              <XAxis type="time" />
              <YAxis type="value" min={0} max={4} splitNumber={4} formatter={(v: number) => `${v * 25}%`} />
              <Line name="CPU" data={CPU_PCT_DATA} />
            </Chart>
          </DndContext>
        </ChartCard>
      </div>
    </div>
  )
}
