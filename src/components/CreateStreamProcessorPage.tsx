import { useState, useRef, useCallback, useEffect } from 'react'
import Badge from '@leafygreen-ui/badge'
import { css, keyframes } from '@leafygreen-ui/emotion'
import { palette } from '@leafygreen-ui/palette'
import { color, fontFamilies, typeScales, spacing } from '@leafygreen-ui/tokens'
import { Body, Link, Subtitle, H3, Overline } from '@leafygreen-ui/typography'
import Button from '@leafygreen-ui/button'
import Icon from '@leafygreen-ui/icon'
import { IconButton } from '@leafygreen-ui/icon-button'
import TextInput from '@leafygreen-ui/text-input'
import { Select, Option } from '@leafygreen-ui/select'
import Checkbox from '@leafygreen-ui/checkbox'
import { Banner } from '@leafygreen-ui/banner'
import Modal from '@leafygreen-ui/modal'
import ConfirmationModal from '@leafygreen-ui/confirmation-modal'
import { GuideCue } from '@leafygreen-ui/guide-cue'
import { Menu, MenuItem } from '@leafygreen-ui/menu'
import { PageLoader } from '@leafygreen-ui/loading-indicator'
import { useToast } from '@leafygreen-ui/toast'
import { Callout } from '@leafygreen-ui/callout'
import { Toggle } from '@leafygreen-ui/toggle'
import { SegmentedControl, SegmentedControlOption } from '@leafygreen-ui/segmented-control'
import { CodeEditor } from '@leafygreen-ui/code-editor'
import FormFooter from '@leafygreen-ui/form-footer'

const borderSecondary = color.light.border.tertiary.default

const TIER_OPTIONS = [
  { value: 'SP2',  label: 'SP2',  description: 'For development environments.',                                        price: '$0.06/hr' },
  { value: 'SP5',  label: 'SP5',  description: 'For minimal complexity processors.',                                   price: '$0.11/hr' },
  { value: 'SP10', label: 'SP10', description: 'For development environments and low-traffic applications.',           price: '$0.19/hr' },
  { value: 'SP30', label: 'SP30', description: 'For moderate complexity and medium-traffic processors.',               price: '$0.39/hr' },
  { value: 'SP50', label: 'SP50', description: 'For high-traffic processors and heavy aggregations.',                  price: '$1.56/hr' },
]

const spinAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

const spinnerSvgStyles = css`
  animation: ${spinAnimation} 0.75s linear infinite;
  display: block;
  flex-shrink: 0;
`

// ─── Types ───────────────────────────────────────────────────────────────────
interface Stage {
  id: string
  type: string
  samplesVisible: boolean
  isOpen: boolean
}

const STAGE_TYPES = ['Custom Stage', '$group', '$match', '$merge', '$tumblingWindow', '$https', '$emit']

const getStageJson = (type: string) => {
  const examples: Record<string, string> = {
    '$group': '"$group": {\n  "_id": "$category",\n  "total": { "$sum": "$amount" }\n}',
    '$match': '"$match": {\n  "status": "active",\n  "value": { "$gt": 100 }\n}',
    '$merge': '"$merge": {\n  "into": "output_collection",\n  "on": "_id"\n}',
    '$tumblingWindow': '"$tumblingWindow": {\n  "size": { "value": 5, "unit": "minute" }\n}',
    '$https': '"$https": {\n  "url": "https://api.example.com/data",\n  "method": "POST"\n}',
    '$emit': '"$emit": {\n  "connectionName": "atlas_sink",\n  "db": "output_db",\n  "coll": "emitted_events"\n}',
  }
  return examples[type] ?? '{\n  \n}'
}

const SAMPLE_DOCS = [
  [
    'panelId : "SP-04821"',
    'status : "active"',
    'value : 245.7',
    'temp_c : 71.3',
    'irradiance : 856',
    'efficiency : 0.183',
    'ts : "2024-01-15T08:42:11Z"',
  ],
  [
    'panelId : "SP-09134"',
    'status : "active"',
    'value : 318.2',
    'temp_c : 68.9',
    'irradiance : 912',
    'efficiency : 0.201',
    'ts : "2024-01-15T08:42:13Z"',
  ],
  [
    'panelId : "SP-02567"',
    'status : "active"',
    'value : 179.4',
    'temp_c : 74.1',
    'irradiance : 743',
    'efficiency : 0.167',
    'ts : "2024-01-15T08:42:14Z"',
  ],
]

// ─── Page shell ────────────────────────────────────────────────────────────
const pageStyles = css`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: ${palette.white};
  position: relative;
`

const stickyHeaderStyles = css`
  flex-shrink: 0;
  padding: ${spacing[600]}px ${spacing[1000]}px 0;
  background: ${palette.white};
  position: relative;
  z-index: 10;
`

const scrollableStyles = css`
  flex: 1;
  overflow-y: auto;
  padding: ${spacing[400]}px ${spacing[1000]}px ${spacing[800]}px;
`


// ─── Header ────────────────────────────────────────────────────────────────
const backLinkStyles = css`
  display: flex;
  align-items: center;
  gap: ${spacing[100]}px;
  margin-bottom: ${spacing[300]}px;
  font-size: 13px;
  color: ${palette.blue.base};
  cursor: pointer;
  width: fit-content;
`

const pageTitleStyles = css`
  font-family: 'MongoDB Value Serif', Georgia, serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 40px;
  color: ${palette.black};
  margin: 0 0 ${spacing[200]}px 0;
`

const subtitleRowStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing[100]}px;
  padding-top: ${spacing[100]}px;
`

const contentWrapperStyles = css`
  width: 100%;
  padding: 0 ${spacing[800]}px;
  box-sizing: border-box;
`

const headerContentDividerStyles = css`
  border: none;
  border-top: 1px solid ${color.light.border.secondary.default};
  margin: ${spacing[200]}px 0 ${spacing[200]}px;
`

// ─── Section header ─────────────────────────────────────────────────────────
const sectionHeaderStyles = css`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: ${spacing[400]}px;
`

const sectionNumberStyles = css`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid ${palette.gray.dark1};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: ${palette.gray.dark1};
  flex-shrink: 0;
`

const sectionDividerStyles = css`
  border: none;
  border-top: 1px solid ${color.light.border.secondary.default};
  margin: ${spacing[800]}px 0;
`

// ─── Pipeline card base ──────────────────────────────────────────────────────
const pipelineCardStyles = css`
  border: 1px solid ${borderSecondary};
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0;
`

const pipelineCardHeaderStyles = css`
  display: flex;
  align-items: center;
  gap: ${spacing[50]}px;
  padding: ${spacing[150]}px ${spacing[200]}px;
  background: ${palette.white};
  border-bottom: 1px solid ${borderSecondary};
`

const pipelineCardTitleStyles = css`
  font-size: 13px;
  font-weight: 600;
  color: ${palette.gray.dark3};
`

const pipelineCardActionsStyles = css`
  display: flex;
  align-items: center;
  gap: ${spacing[100]}px;
  margin-left: auto;
`

const pipelineCardBodyStyles = css`
  padding: ${spacing[400]}px;
`

const fieldLabelStyles = css`
  font-size: 13px;
  font-weight: 600;
  color: ${palette.gray.dark3};
  margin-bottom: 4px;
  display: block;
`

const fieldDescStyles = css`
  font-size: 13px;
  color: ${palette.gray.dark1};
  margin-bottom: 8px;
`

// ─── Split body (code + panel) ───────────────────────────────────────────────
const splitBodyStyles = css`
  display: flex;
  min-height: 120px;
`

const codeColumnStyles = css`
  flex: 1;
  padding: ${spacing[300]}px ${spacing[400]}px;
  border-right: 1px solid ${borderSecondary};
  min-width: 0;
  background: ${palette.gray.light3};
`

const connectionColumnStyles = css`
  width: 260px;
  flex-shrink: 0;
  padding: ${spacing[400]}px;
`

// ─── Stage card extras ───────────────────────────────────────────────────────
const samplesColumnStyles = css`
  flex: 1;
  padding: ${spacing[300]}px ${spacing[400]}px;
  border-left: 1px solid ${borderSecondary};
  min-width: 0;
  overflow: hidden;
`

const samplePreviewTitleStyles = css`
  color: ${color.light.text.primary.default};
  margin: 0 0 ${spacing[200]}px 0;
`

const sampleDocsRowStyles = css`
  display: flex;
  gap: 10px;
  overflow-x: auto;
`

const sampleDocStyles = css`
  border: 1px solid ${borderSecondary};
  border-radius: 4px;
  padding: ${spacing[200]}px 10px ${spacing[200]}px ${spacing[600]}px;
  min-width: 180px;
  max-height: 120px;
  flex-shrink: 0;
  background: ${palette.white};
  overflow-y: auto;
  position: relative;
`

const sampleDocCaretStyles = css`
  position: absolute;
  top: ${spacing[200]}px;
  left: ${spacing[150]}px;
  color: ${palette.gray.dark1};
  line-height: 1;
`

const sampleFieldStyles = css`
  font-family: ${fontFamilies.code};
  font-size: ${typeScales.code1.fontSize}px;
  line-height: ${typeScales.code1.lineHeight}px;
  color: ${palette.gray.dark2};
  white-space: nowrap;
`

// ─── Add stage button ────────────────────────────────────────────────────────
const addStageRowStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: ${spacing[100]}px 0;
`

// ─── Pipeline builder card ───────────────────────────────────────────────────
const pipelineBuilderStyles = css`
  border: 2px dashed ${palette.gray.light1};
  border-radius: 8px;
  padding: ${spacing[600]}px;
  text-align: left;
  margin-bottom: 0;
`

const pipelineBuilderTitleStyles = css`
  font-size: 18px;
  font-weight: 600;
  color: ${palette.gray.dark3};
  margin: 0 0 ${spacing[100]}px 0;
`

const pipelineBuilderDescStyles = css`
  font-size: 13px;
  color: ${palette.gray.dark1};
  margin-bottom: ${spacing[400]}px;
`

const stageChipsStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing[200]}px;
  margin-bottom: ${spacing[300]}px;
`

const stageChipStyles = css`
  display: flex;
  align-items: center;
  gap: ${spacing[100]}px;
  padding: ${spacing[100]}px ${spacing[300]}px;
  border: 1px solid ${palette.gray.light1};
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  color: ${palette.gray.dark2};
  background: ${palette.white};
  cursor: pointer;
  font-family: inherit;
  &:hover { background: ${palette.gray.light3}; }
`

// ─── Details card ─────────────────────────────────────────────────────────────
const detailsCardHeaderStyles = css`
  display: flex;
  align-items: center;
  gap: ${spacing[50]}px;
  padding: ${spacing[150]}px ${spacing[400]}px ${spacing[150]}px ${spacing[200]}px;
  background: ${palette.gray.light3};
  border-bottom: 1px solid ${borderSecondary};
`

const expandableCardContainerStyles = css`
  margin-bottom: ${spacing[600]}px;
`

const serviceDetailsBodyStyles = css`
  display: flex;
  flex-direction: column;
  gap: ${spacing[400]}px;
  padding: ${spacing[100]}px 0 0;
`

const serviceDetailsDividerStyles = css`
  border: none;
  border-top: 1px solid ${color.light.border.secondary.default};
  margin: 0;
`

// ─── View mode horizontal field rows ─────────────────────────────────────────
const viewFieldRowStyles = css`
  display: flex;
  align-items: center;
  min-height: 48px;
  padding-top: ${spacing[400]}px;
  padding-bottom: ${spacing[400]}px;
  border-bottom: 1px solid ${color.light.border.secondary.default};
  &:last-child { border-bottom: none; }
`

const viewFieldLabelStyles = css`
  width: 40%;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: ${palette.gray.dark3};
  padding-right: ${spacing[400]}px;
`

const viewFieldControlStyles = css`
  width: 300px;
  flex-shrink: 0;
  margin-left: auto;
  & > div { margin-bottom: 0 !important; }
`

// ─── Source / Sink pipeline card ──────────────────────────────────────────────
function PipelineCard({
  title,
  optionsLabel,
  connectionLabel,
  connections,
  connection,
  onConnectionChange,
  jsonKey,
  placeholder,
  disabled,
  defaultOpen = true,
  forceOpen,
}: {
  title: string
  optionsLabel: string
  connectionLabel: string
  connections: Array<{ value: string; label: string }>
  connection: string
  onConnectionChange: (v: string) => void
  jsonKey: string
  placeholder: string
  disabled?: boolean
  defaultOpen?: boolean
  forceOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    if (forceOpen) setOpen(true)
  }, [forceOpen])
  const isConfigured = !!connection
  const [code, setCode] = useState(connection ? `"${jsonKey}": {\n  "connectionName": "${connection}"\n}` : '')

  useEffect(() => {
    setCode(connection ? `"${jsonKey}": {\n  "connectionName": "${connection}"\n}` : '')
  }, [connection, jsonKey])

  return (
    <div className={pipelineCardStyles}>
      <div className={pipelineCardHeaderStyles} style={{ borderBottom: open ? `1px solid ${borderSecondary}` : 'none' }}>
        <IconButton aria-label={open ? 'Collapse' : 'Expand'} onClick={() => setOpen(o => !o)}>
          <Icon glyph={open ? 'ChevronUp' : 'ChevronDown'} size="small" style={{ color: palette.gray.dark1 }} />
        </IconButton>
        <span className={pipelineCardTitleStyles}>{title}</span>
        <div className={pipelineCardActionsStyles}>
          <Link href="#">{optionsLabel}<Icon glyph="OpenNewTab" size="small" style={{ position: 'relative', top: 0, marginLeft: 2 }} /></Link>
          <IconButton aria-label="Expand"><Icon glyph="FullScreenEnter" size="small" /></IconButton>
        </div>
      </div>

      {open && !isConfigured && (
        <div className={pipelineCardBodyStyles} style={{ padding: '32px 48px' }}>
          <span className={fieldLabelStyles}>{placeholder}</span>
          <p className={fieldDescStyles}>
            To add additional connections, navigate to the{' '}
            <Link href="#">connection registry</Link>.
          </p>
          <Select label="" placeholder="Select connection" value={connection} onChange={onConnectionChange} disabled={disabled} size="small">
            {connections.map(c => <Option key={c.value} value={c.value}>{c.label}</Option>)}
          </Select>
        </div>
      )}

      {open && isConfigured && (
        <div className={splitBodyStyles}>
          <div
            className={codeColumnStyles}
            style={{ position: 'relative' }}
            onMouseEnter={e => { const el = e.currentTarget.querySelector<HTMLElement>('[data-code-actions]'); if (el) el.style.opacity = '1' }}
            onMouseLeave={e => { const el = e.currentTarget.querySelector<HTMLElement>('[data-code-actions]'); if (el) el.style.opacity = '0' }}
          >
            <div data-code-actions style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 1, opacity: 0, transition: 'opacity 0.15s' }}>
              <Button variant="default" size="xsmall" leftGlyph={<Icon glyph="Copy" size="small" />} aria-label="Copy" />
              <Button variant="default" size="xsmall" leftGlyph={<Icon glyph="Format" size="small" />} aria-label="Format" />
            </div>
            <div style={{ display: 'flex', paddingTop: 4, minHeight: 96 }}>
              <div style={{
                fontFamily: fontFamilies.code,
                fontSize: typeScales.code1.fontSize,
                lineHeight: `${typeScales.code1.lineHeight}px`,
                color: palette.gray.base,
                textAlign: 'right',
                userSelect: 'none',
                paddingRight: 12,
                minWidth: 24,
                flexShrink: 0,
              }}>
                {Array.from({ length: Math.max(1, code.split('\n').length) }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                readOnly={disabled}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  background: 'transparent',
                  fontFamily: fontFamilies.code,
                  fontSize: typeScales.code1.fontSize,
                  lineHeight: `${typeScales.code1.lineHeight}px`,
                  color: palette.gray.dark3,
                  padding: 0,
                  minHeight: 96,
                  opacity: disabled ? 0.6 : 1,
                }}
              />
            </div>
          </div>
          <div className={connectionColumnStyles}>
            <span className={fieldLabelStyles}>{connectionLabel}</span>
            <p className={fieldDescStyles}>
              To add additional connections, navigate to the{' '}
              <Link href="#">Connection Registry</Link>.
            </p>
            <Select label="" value={connection} onChange={onConnectionChange} disabled={disabled} size="small">
              {connections.map(c => <Option key={c.value} value={c.value}>{c.label}</Option>)}
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Stage card ───────────────────────────────────────────────────────────────
function StageCard({
  stage,
  stageNumber,
  onTypeChange,
  onToggleOpen,
  onAddBefore,
  onAddAfter,
  onDelete,
  disabled,
}: {
  stage: Stage
  stageNumber: number
  onTypeChange: (id: string, type: string) => void
  onToggleOpen: (id: string) => void
  onAddBefore?: () => void
  onAddAfter?: () => void
  onDelete?: () => void
  disabled?: boolean
}) {
  const [splitPct, setSplitPct] = useState(50)
  const [code, setCode] = useState('')
  const [localSamplesVisible, setLocalSamplesVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  // Auto-fill JSON and show samples when a known stage type is selected
  useEffect(() => {
    if (stage.type === 'Custom Stage') {
      setCode('')
      setLocalSamplesVisible(false)
    } else {
      setCode(getStageJson(stage.type))
      setLocalSamplesVisible(true)
    }
  }, [stage.type])

  // Also auto-show samples when the user manually types valid JSON
  useEffect(() => {
    if (!code.trim()) return
    try {
      JSON.parse('{' + code + '}')
      setLocalSamplesVisible(true)
    } catch {
      // incomplete / invalid — leave samples state unchanged
    }
  }, [code])

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setSplitPct(Math.max(20, Math.min(80, pct)))
    }

    const onMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  return (
    <div className={pipelineCardStyles}>
      <div className={pipelineCardHeaderStyles} style={{ borderBottom: stage.isOpen ? `1px solid ${borderSecondary}` : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton aria-label={stage.isOpen ? 'Collapse' : 'Expand'} onClick={() => onToggleOpen(stage.id)}>
            <Icon
              glyph={stage.isOpen ? 'ChevronUp' : 'ChevronDown'}
              size="small"
              style={{ color: palette.gray.dark1 }}
            />
          </IconButton>
          <span className={pipelineCardTitleStyles}>Stage {stageNumber}</span>
        </div>
        <div style={{ width: 220, marginLeft: 8 }} onClick={e => e.stopPropagation()}>
          <Select
            value={stage.type}
            onChange={val => onTypeChange(stage.id, val)}
            aria-label="Stage type"
            size="xsmall"
            disabled={disabled}
          >
            {STAGE_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
          </Select>
        </div>
        <div className={pipelineCardActionsStyles} onClick={e => e.stopPropagation()}>
          {stage.isOpen && (
            <Button variant="default" size="xsmall" disabled={!code.trim()} onClick={() => setLocalSamplesVisible(v => !v)}>
              {localSamplesVisible ? 'Hide samples' : 'Show samples'}
            </Button>
          )}
          <IconButton aria-label="Expand"><Icon glyph="FullScreenEnter" size="small" /></IconButton>
          <Menu
            trigger={<IconButton aria-label="More options"><Icon glyph="Ellipsis" size="small" /></IconButton>}
            darkMode={false}
            spacing={2}
          >
            <MenuItem glyph={<Icon glyph="PlusWithCircle" />} onClick={onAddAfter}>Add stage after</MenuItem>
            <MenuItem glyph={<Icon glyph="PlusWithCircle" />} onClick={onAddBefore}>Add stage before</MenuItem>
            <MenuItem glyph={<Icon glyph="Trash" />} variant="destructive" onClick={onDelete}>Delete stage</MenuItem>
            <MenuItem glyph={<Icon glyph="ChevronDown" />} onClick={() => { if (!stage.isOpen) onToggleOpen(stage.id) }}>Expand documents</MenuItem>
            <MenuItem glyph={<Icon glyph="ChevronUp" />} onClick={() => { if (stage.isOpen) onToggleOpen(stage.id) }}>Collapse documents</MenuItem>
          </Menu>
        </div>
      </div>

      {stage.isOpen && (
        <div className={splitBodyStyles} ref={containerRef}>
          {/* Left: code panel */}
          <div
            className={codeColumnStyles}
            style={{ width: localSamplesVisible && code.trim() ? `${splitPct}%` : '100%', flex: 'none', borderRight: 'none', position: 'relative' }}
            onMouseEnter={e => { const el = e.currentTarget.querySelector<HTMLElement>('[data-code-actions]'); if (el) el.style.opacity = '1' }}
            onMouseLeave={e => { const el = e.currentTarget.querySelector<HTMLElement>('[data-code-actions]'); if (el) el.style.opacity = '0' }}
          >
            <div data-code-actions style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 1, opacity: 0, transition: 'opacity 0.15s' }}>
              <Button variant="default" size="xsmall" leftGlyph={<Icon glyph="Copy" size="small" />} aria-label="Copy" />
              <Button variant="default" size="xsmall" leftGlyph={<Icon glyph="Format" size="small" />} aria-label="Format" />
            </div>
            <div style={{ display: 'flex', paddingTop: 4, minHeight: 96 }}>
              {/* Line numbers */}
              <div style={{
                fontFamily: fontFamilies.code,
                fontSize: typeScales.code1.fontSize,
                lineHeight: `${typeScales.code1.lineHeight}px`,
                color: palette.gray.base,
                textAlign: 'right',
                userSelect: 'none',
                paddingRight: 12,
                minWidth: 24,
                flexShrink: 0,
              }}>
                {Array.from({ length: Math.max(1, code.split('\n').length) }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              {/* Editable textarea */}
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                readOnly={disabled}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  background: 'transparent',
                  fontFamily: fontFamilies.code,
                  fontSize: typeScales.code1.fontSize,
                  lineHeight: `${typeScales.code1.lineHeight}px`,
                  color: palette.gray.dark3,
                  padding: 0,
                  minHeight: 96,
                }}
              />
            </div>
          </div>

          {/* Draggable divider — only shown when samples panel is open */}
          {localSamplesVisible && code.trim() && (
            <div
              onMouseDown={handleDividerMouseDown}
              style={{
                width: 9,
                flexShrink: 0,
                cursor: 'col-resize',
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div style={{
                width: 1,
                background: color.light.border.tertiary.default,
                transition: 'background 0.15s',
                pointerEvents: 'none',
              }} />
            </div>
          )}

          {/* Right: samples panel — only rendered when visible and code exists */}
          {localSamplesVisible && code.trim() && (
            <div className={samplesColumnStyles} style={{ flex: 1, borderLeft: 'none' }}>
              <Body className={samplePreviewTitleStyles}>
                Output preview after Stage {stageNumber} (Sample of 3 documents)
              </Body>
              <div className={sampleDocsRowStyles}>
                {[0, 1, 2].map(docIdx => (
                  <div key={docIdx} className={sampleDocStyles}>
                    <span className={sampleDocCaretStyles}>
                      <Icon glyph="CaretRight" size="small" />
                    </span>
                    {SAMPLE_DOCS[docIdx].map((f, fi) => {
                      const colonIdx = f.indexOf(' : ')
                      const key = colonIdx >= 0 ? f.slice(0, colonIdx) : f
                      const val = colonIdx >= 0 ? f.slice(colonIdx) : ''
                      return (
                        <div key={fi} className={sampleFieldStyles}>
                          {key}
                          <span style={{ color: palette.green.dark2 }}>{val}</span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Pipeline connector (view mode arrow) ───────────────────────────────────
function PipelineConnector() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 8 }}>
      <Icon glyph="ArrowDown" size="large" style={{ color: palette.gray.dark1 }} />
    </div>
  )
}

// ─── Add stage row ─────────────────────────────────────────────────────────
function AddStageRow({ onAdd }: { onAdd: () => void }) {
  return (
    <div className={addStageRowStyles}>
      <IconButton aria-label="Add stage" onClick={onAdd}>
        <Icon glyph="PlusWithCircle" />
      </IconButton>
    </div>
  )
}

// ─── Details Card ────────────────────────────────────────────────────────────
function DetailsCard({
  title,
  optional = false,
  defaultOpen = false,
  forceOpen,
  children,
}: {
  title: string
  optional?: boolean
  defaultOpen?: boolean
  forceOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    if (forceOpen) setOpen(true)
  }, [forceOpen])
  return (
    <div className={pipelineCardStyles}>
      <div className={detailsCardHeaderStyles} style={{ borderBottom: open ? `1px solid ${borderSecondary}` : 'none' }}>
        <IconButton aria-label={open ? 'Collapse' : 'Expand'} onClick={() => setOpen(o => !o)}>
          <Icon glyph={open ? 'ChevronUp' : 'ChevronDown'} size="small" style={{ color: palette.gray.dark1 }} />
        </IconButton>
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <Body baseFontSize={13} style={{ fontWeight: 600 }}>{title}</Body>
          {optional && (
            <Body baseFontSize={13} style={{ color: color.light.text.secondary.default }}>
              (Optional)
            </Body>
          )}
        </div>
      </div>
      {open && <div className={pipelineCardBodyStyles}>{children}</div>}
    </div>
  )
}

// ─── Advanced Settings Content ────────────────────────────────────────────────
function AdvancedSettingsContent({
  failoverEnabled,
  onChange,
  disabled,
}: {
  failoverEnabled: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
      <div style={{ flex: 1 }}>
        <Body baseFontSize={13} style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>
          Enable failover processor(s)
        </Body>
        <Body baseFontSize={13} style={{ display: 'block', marginBottom: 8, color: color.light.text.secondary.default }}>
          Create a clone, backup processor in your failover regions that copies over checkpoint data while the main processor runs.{' '}
          <Link href="#">View docs<Icon glyph="OpenNewTab" size="small" style={{ position: 'relative', top: 0, marginLeft: 2 }} /></Link>
        </Body>
      </div>
      <Toggle
        checked={failoverEnabled}
        onChange={(checked) => onChange(checked)}
        aria-label="Enable failover processor"
        size="small"
        darkMode={false}
        disabled={disabled}
      />
    </div>
  )
}

// ─── Page component ──────────────────────────────────────────────────────────
export function CreateStreamProcessorPage({ onBack, onCreateProcessor, viewMode = false, viewProcessor }: {
  onBack: () => void
  onCreateProcessor?: (processor: { name: string; status: 'RUNNING' | 'STOPPED'; currentTier: string; autoscalingEnabled: boolean; failoverEnabled: boolean }) => void
  viewMode?: boolean
  viewProcessor?: { name: string; status: 'RUNNING' | 'STOPPED' | 'FAILED' | 'BACKING UP'; currentTier: string }
}) {
  const { pushToast } = useToast()
  const uploadBtnRef = useRef<HTMLElement>(null)
  const [guideCueOpen, setGuideCueOpen] = useState(!viewMode)
  const [view, setView] = useState<'visual' | 'json'>('visual')
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const [editorHeight, setEditorHeight] = useState(500)
  const [processorName, setProcessorName] = useState(viewMode && viewProcessor ? viewProcessor.name : '')
  const [tier, setTier] = useState(viewMode && viewProcessor ? viewProcessor.currentTier : 'SP10')
  const [startOnCreate, setStartOnCreate] = useState(true)
  const [autoscalingEnabled, setAutoscalingEnabled] = useState(false)
  const [minTier, setMinTier] = useState('SP10')
  const [maxTier, setMaxTier] = useState('SP30')
  const [startingTier, setStartingTier] = useState('SP10')
  const [sourceConnection, setSourceConnection] = useState(viewMode ? 'sample_solar' : '')
  const [sinkConnection, setSinkConnection] = useState(viewMode ? 'atlas_sink' : '')
  const [stages, setStages] = useState<Stage[]>(viewMode ? [
    { id: 'view-stage-1', type: '$match', samplesVisible: false, isOpen: false }
  ] : [])
  const [dlqConnection, setDlqConnection] = useState(viewMode ? 'connection1' : '')
  const [dlqDatabase, setDlqDatabase] = useState(viewMode ? 'Db1' : '')
  const [dlqCollection, setDlqCollection] = useState(viewMode ? 'Coll1' : '')
  const [failoverEnabled, setFailoverEnabled] = useState(false)
  const [jsonEditorContent, setJsonEditorContent] = useState('')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'fileSelected'>('idle')
  const [isImporting, setIsImporting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showDlqError, setShowDlqError] = useState(false)
  const [processorStatus, setProcessorStatus] = useState<'RUNNING' | 'STOPPED' | 'FAILED' | 'BACKING UP'>(
    viewMode && viewProcessor ? viewProcessor.status : 'STOPPED'
  )
  const [editMode, setEditMode] = useState(false)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)
  const [isSavingChanges, setIsSavingChanges] = useState(false)

  useEffect(() => {
    if (editMode) {
      setStages(prev => prev.map(s => ({ ...s, isOpen: true })))
    }
  }, [editMode])

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showCheckpointConfirm, setShowCheckpointConfirm] = useState(false)
  const [checkpointReasons, setCheckpointReasons] = useState<Array<'source' | 'emit'>>([])
  const [hasEdits, setHasEdits] = useState(false)
  const editSnapshot = useRef('')
  const cancelFromBackLink = useRef(false)

  useEffect(() => {
    if (editMode) {
      editSnapshot.current = JSON.stringify({ processorName, tier, sourceConnection, sinkConnection, stages: stages.map(s => s.type), dlqConnection, dlqDatabase, dlqCollection, failoverEnabled })
      setHasEdits(false)
    } else {
      editSnapshot.current = ''
      setHasEdits(false)
    }
  }, [editMode])

  useEffect(() => {
    if (!editMode || !editSnapshot.current) return
    const current = JSON.stringify({ processorName, tier, sourceConnection, sinkConnection, stages: stages.map(s => s.type), dlqConnection, dlqDatabase, dlqCollection, failoverEnabled })
    setHasEdits(current !== editSnapshot.current)
  }, [editMode, processorName, tier, sourceConnection, sinkConnection, stages, dlqConnection, dlqDatabase, dlqCollection, failoverEnabled])

  useEffect(() => {
    if (view !== 'json') return
    // Content below the editor container (marginBottom + checkbox + advanced card + footer)
    // create mode: editor marginBottom(60) + checkbox(~116) + advanced card(~52) + scrollable padding(32) + footer(~72) = ~332
    // view/edit mode: editor marginBottom(60) + advanced card(~52) + scrollable padding(32) + footer(~88) = ~232
    const belowContent = !viewMode ? 332 : 232
    const compute = () => {
      const top = editorContainerRef.current?.getBoundingClientRect().top ?? 300
      const h = Math.max(400, Math.min(720, window.innerHeight - top - belowContent))
      setEditorHeight(h)
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [view, viewMode, editMode])

  const dlqPartiallyFilled =
    (!!dlqConnection || !!dlqDatabase || !!dlqCollection) &&
    !(dlqConnection && dlqDatabase && dlqCollection)

  const createHasProgress = !viewMode && !!(processorName.trim() || sourceConnection || sinkConnection || stages.length > 0)

  const handleCancel = () => {
    if (viewMode ? hasEdits : createHasProgress) {
      setShowCancelConfirm(true)
    } else if (viewMode) {
      setEditMode(false)
    } else {
      onBack()
    }
  }

  const commitSave = (afterSave: () => void) => {
    setIsSavingChanges(true)
    setTimeout(() => {
      setIsSavingChanges(false)
      afterSave()
    }, 1800)
  }

  const handleSaveChanges = () => {
    const snapshot = editSnapshot.current ? JSON.parse(editSnapshot.current) : null
    const reasons: Array<'source' | 'emit'> = []

    if (snapshot && sourceConnection !== snapshot.sourceConnection) {
      reasons.push('source')
    }

    const originalEmitCount = snapshot
      ? (snapshot.stages as string[]).filter(t => t === '$emit').length
      : 0
    const currentEmitCount = stages.filter(s => s.type === '$emit').length
    if (currentEmitCount > originalEmitCount) {
      reasons.push('emit')
    }

    if (reasons.length > 0) {
      setCheckpointReasons(reasons)
      setShowCheckpointConfirm(true)
    } else {
      commitSave(() => {
        setEditMode(false)
        const name = processorName.trim() || (viewProcessor?.name ?? '')
        pushToast({
          variant: 'success',
          title: `Changes to "${name}" saved successfully.`,
          timeout: 6000,
        })
      })
    }
  }

  const handleEditClick = () => {
    setIsLoadingEdit(true)
    setTimeout(() => {
      setIsLoadingEdit(false)
      setEditMode(true)
    }, 1800)
  }

  const confirmCancel = () => {
    setShowCancelConfirm(false)
    if (cancelFromBackLink.current) {
      cancelFromBackLink.current = false
      onBack()
    } else if (viewMode) {
      setEditMode(false)
    } else {
      onBack()
    }
  }

  const buildPipelineJson = () => {
    const pipeline: any[] = []
    pipeline.push({ $source: sourceConnection ? { connectionName: sourceConnection } : {} })
    stages.forEach(stage => {
      const obj: Record<string, any> = {}
      switch (stage.type) {
        case '$group': obj['$group'] = { _id: '$category', total: { $sum: '$amount' } }; break
        case '$match': obj['$match'] = { status: 'active', value: { $gt: 100 } }; break
        case '$merge': obj['$merge'] = { into: 'output_collection', on: '_id' }; break
        case '$tumblingWindow': obj['$tumblingWindow'] = { size: { value: 5, unit: 'minute' } }; break
        case '$https': obj['$https'] = { url: 'https://api.example.com/data', method: 'POST' }; break
        default: obj[stage.type] = {}
      }
      pipeline.push(obj)
    })
    pipeline.push({ $sink: sinkConnection ? { connectionName: sinkConnection } : {} })

    const doc: Record<string, any> = {}
    if (processorName.trim()) doc.name = processorName.trim()
    if (tier) doc.tier = tier
    doc.pipeline = pipeline
    if (dlqConnection || dlqDatabase || dlqCollection) {
      const dlq: Record<string, string> = {}
      if (dlqConnection) dlq.connectionName = dlqConnection
      if (dlqDatabase) dlq.db = dlqDatabase
      if (dlqCollection) dlq.coll = dlqCollection
      doc.dlq = dlq
    }
    return JSON.stringify(doc, null, 2)
  }

  const tryParseJsonToVisual = (json: string) => {
    try {
      const doc = JSON.parse(json)
      // Support both the wrapped object format and bare pipeline array
      const pipeline = Array.isArray(doc) ? doc : doc.pipeline
      if (!Array.isArray(pipeline)) return

      if (!Array.isArray(doc)) {
        if (doc.name !== undefined) setProcessorName(doc.name)
        if (doc.tier !== undefined) setTier(doc.tier)
        if (doc.dlq) {
          if (doc.dlq.connectionName !== undefined) setDlqConnection(doc.dlq.connectionName)
          if (doc.dlq.db !== undefined) setDlqDatabase(doc.dlq.db)
          if (doc.dlq.coll !== undefined) setDlqCollection(doc.dlq.coll)
        }
      }

      const sourceEntry = pipeline.find((s: any) => '$source' in s)
      if (sourceEntry?.$source?.connectionName) setSourceConnection(sourceEntry.$source.connectionName)
      const sinkEntry = pipeline.find((s: any) => '$sink' in s)
      if (sinkEntry?.$sink?.connectionName) setSinkConnection(sinkEntry.$sink.connectionName)
      const stageEntries = pipeline.filter((s: any) => !('$source' in s) && !('$sink' in s))
      setStages(stageEntries.map((entry: any) => ({
        id: `${Date.now()}-${Math.random()}`,
        type: Object.keys(entry)[0] as string,
        samplesVisible: false,
        isOpen: true,
      })))
    } catch {
      // Invalid JSON, keep current state
    }
  }

  const handleViewChange = (newView: 'visual' | 'json') => {
    if (newView === 'json') {
      setJsonEditorContent(buildPipelineJson())
    } else {
      tryParseJsonToVisual(jsonEditorContent)
    }
    setView(newView)
  }

  const addStage = (type: string, insertIndex: number) => {
    const newStage: Stage = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      samplesVisible: true,
      isOpen: true,
    }
    setStages(prev => {
      const next = [...prev]
      next.splice(insertIndex, 0, newStage)
      return next
    })
  }

  const removeStage = (id: string) => {
    setStages(prev => prev.filter(s => s.id !== id))
  }

  const updateStageType = (id: string, type: string) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, type } : s))
  }

  const toggleStageOpen = (id: string) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, isOpen: !s.isOpen } : s))
  }

  return (
    <div className={pageStyles}>
      {isLoadingEdit && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: palette.white,
          zIndex: 100,
        }}>
          <PageLoader description="Loading processor..." />
        </div>
      )}
      {isSavingChanges && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: palette.white,
          zIndex: 100,
        }}>
          <PageLoader description="Saving changes..." />
        </div>
      )}
      <div className={stickyHeaderStyles}>
        <div className={backLinkStyles} onClick={() => {
          if (viewMode && hasEdits) { cancelFromBackLink.current = true; setShowCancelConfirm(true) }
          else if (!viewMode && createHasProgress) { cancelFromBackLink.current = true; setShowCancelConfirm(true) }
          else { onBack() }
        }}>
          <Icon glyph="ArrowLeft" size="small" />
          <span>Back to list of stream processors</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          {viewMode && viewProcessor ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h1 className={pageTitleStyles} style={{ margin: 0 }}>
                  {editMode ? 'Edit stream processor' : processorName}
                </h1>
                {!editMode && (
                  <Badge variant={processorStatus === 'RUNNING' ? 'green' : 'lightgray'}>{processorStatus}</Badge>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {editMode ? (
                  <>
                    <Button variant="default" leftGlyph={<Icon glyph="Upload" />} onClick={() => setUploadModalOpen(true)}>Upload file</Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="default"
                      leftGlyph={<Icon glyph={processorStatus === 'RUNNING' ? 'Stop' : 'Play'} />}
                      onClick={() => setProcessorStatus(s => s === 'RUNNING' ? 'STOPPED' : 'RUNNING')}
                    >
                      {processorStatus === 'RUNNING' ? 'Stop processor' : 'Start processor'}
                    </Button>
                    <Button
                      variant="default"
                      leftGlyph={<Icon glyph="Edit" />}
                      disabled={processorStatus === 'RUNNING'}
                      onClick={handleEditClick}
                    >
                      Edit processor
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <h1 className={pageTitleStyles} style={{ margin: 0 }}>Create stream processor</h1>
              <span ref={uploadBtnRef as React.RefObject<HTMLSpanElement>} style={{ display: 'inline-flex' }}>
                <Button variant="default" leftGlyph={<Icon glyph="Upload" />} onClick={() => { setUploadModalOpen(true); setGuideCueOpen(false) }}>Upload file</Button>
              </span>
              <GuideCue
                open={guideCueOpen}
                setOpen={setGuideCueOpen}
                refEl={uploadBtnRef}
                numberOfSteps={1}
                title="Already have an existing stream processing JSON file?"
                tooltipAlign="bottom"
                tooltipJustify="end"
                darkMode={false}
                onPrimaryButtonClick={() => setGuideCueOpen(false)}
              >
                Upload a stream processor pipeline file and we'll import it into the editor.
              </GuideCue>
            </>
          )}
        </div>

        <div className={subtitleRowStyles}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Body>
              {viewMode
                ? <>For more information on stream processing pipelines, view our{' '}<Link href="#">documentation<Icon glyph="OpenNewTab" size="small" style={{ position: 'relative', top: 0, marginLeft: 2 }} /></Link></>
                : <>For assistance in creating your pipeline, view our{' '}<Link href="#">documentation<Icon glyph="OpenNewTab" size="small" style={{ position: 'relative', top: 0, marginLeft: 2 }} /></Link></>
              }
            </Body>
          </div>
          <SegmentedControl
            value={view}
            onChange={(val) => handleViewChange(val as 'visual' | 'json')}
            size="small"
            darkMode={false}
          >
            <SegmentedControlOption value="visual">Visual Builder</SegmentedControlOption>
            <SegmentedControlOption value="json">JSON Editor</SegmentedControlOption>
          </SegmentedControl>
        </div>

        {/* Info banner — temporarily hidden, re-enable by uncommenting
        {!viewMode && !bannerDismissed && (
          <div style={{ marginBottom: 4, marginTop: 8 }} className={bannerWrapperStyles}>
            <Banner
              variant="info"
              dismissible
              onClose={() => setBannerDismissed(true)}
              darkMode={false}
            >
              <div style={{ width: '100%' }}>
                <Body baseFontSize={13} style={{ fontWeight: 600, display: 'block', marginBottom: 2, color: color.light.text.onInfo.default }}>
                  Already have an existing stream processing JSON file?
                </Body>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginRight: -60 }}>
                  <Body baseFontSize={13} style={{ color: color.light.text.onInfo.default }}>
                    Upload a stream processor pipeline file and we'll import it into the editor.
                  </Body>
                  <Button variant="default" size="xsmall" leftGlyph={<Icon glyph="Upload" />} style={{ flexShrink: 0, marginLeft: 16 }} onClick={() => setUploadModalOpen(true)}>
                    Upload file
                  </Button>
                </div>
              </div>
            </Banner>
          </div>
        )}
        */}

        <hr className={headerContentDividerStyles} />
      </div>

      <div className={scrollableStyles}>

        {view === 'visual' && (<>

        {/* ① Build pipeline */}
        <div className={sectionHeaderStyles}>
          {!viewMode && <div className={sectionNumberStyles}>1</div>}
          <Subtitle>{viewMode ? 'Pipeline configuration' : 'Build pipeline'}</Subtitle>
        </div>

        <div className={contentWrapperStyles}>
          <PipelineCard
            title="Source"
            optionsLabel="See source options"
            connectionLabel="Source connection"
            connections={[
              { value: 'sample_solar', label: 'sample_solar' },
              { value: 'atlas_kafka', label: 'Atlas (Kafka)' },
              { value: 'apache_kafka', label: 'Apache Kafka' },
            ]}
            connection={sourceConnection}
            onConnectionChange={setSourceConnection}
            jsonKey="$source"
            placeholder="Select a source connection"
            disabled={viewMode && !editMode}
            defaultOpen={true}
            forceOpen={editMode}
          />

          {!viewMode && stages.length === 0 ? (
            <>
              <AddStageRow onAdd={() => addStage('Custom Stage', 0)} />
              <div className={pipelineBuilderStyles}>
                <h3 className={pipelineBuilderTitleStyles}>Start building your pipeline</h3>
                <p className={pipelineBuilderDescStyles}>Add a stage suggestion below to get started.</p>
                <div className={stageChipsStyles}>
                  <Button variant="primary" size="small" leftGlyph={<Icon glyph="Plus" />} onClick={() => addStage('Custom Stage', 0)}>
                    Custom stage
                  </Button>
                  {['$merge', '$match', '$group', '$tumblingWindow'].map(stageType => (
                    <button key={stageType} className={stageChipStyles} onClick={() => addStage(stageType, 0)}>
                      + {stageType}
                    </button>
                  ))}
                </div>
                <Link href="#">See supported pipeline stages</Link>
              </div>
              <AddStageRow onAdd={() => addStage('Custom Stage', 0)} />
            </>
          ) : (
            <>
              {viewMode && !editMode ? <PipelineConnector /> : <AddStageRow onAdd={() => addStage('Custom Stage', 0)} />}
              {stages.map((stage, i) => (
                <div key={stage.id}>
                  <StageCard
                    stage={stage}
                    stageNumber={i + 1}
                    onTypeChange={updateStageType}
                    onToggleOpen={toggleStageOpen}
                    onAddBefore={() => addStage('Custom Stage', i)}
                    onAddAfter={() => addStage('Custom Stage', i + 1)}
                    onDelete={() => removeStage(stage.id)}
                    disabled={viewMode && !editMode}
                  />
                  {viewMode && !editMode ? <PipelineConnector /> : <AddStageRow onAdd={() => addStage('Custom Stage', i + 1)} />}
                </div>
              ))}
            </>
          )}

          <PipelineCard
            title="Sink"
            optionsLabel="See sink options"
            connectionLabel="Sink connection"
            connections={[
              { value: 'atlas_sink', label: 'Atlas' },
              { value: 'iceberg_sink', label: 'iceberg_sink' },
            ]}
            connection={sinkConnection}
            onConnectionChange={setSinkConnection}
            jsonKey="$sink"
            placeholder="Select a sink connection"
            disabled={viewMode && !editMode}
            defaultOpen={true}
            forceOpen={editMode}
          />
        </div>

        {/* Divider */}
        <hr className={sectionDividerStyles} />

        {/* ② Enter processor details */}
        <div className={sectionHeaderStyles}>
          {!viewMode && <div className={sectionNumberStyles}>2</div>}
          <Subtitle>{viewMode ? 'Processor details' : 'Enter processor details'}</Subtitle>
        </div>

        <div className={contentWrapperStyles}>
          <div className={expandableCardContainerStyles}>
            <DetailsCard title="Service details" defaultOpen={!viewMode} forceOpen={editMode}>
              {viewMode ? (
                <div>
                  <div className={viewFieldRowStyles}>
                    <span className={viewFieldLabelStyles}>Stream processor name</span>
                    <div className={viewFieldControlStyles}>
                      <TextInput label="" aria-label="Stream processor name" value={processorName} onChange={e => setProcessorName(e.target.value)} disabled={!editMode} sizeVariant="small" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[200], marginTop: spacing[400], marginBottom: spacing[400] }}>
                    <Overline style={{ color: color.light.text.secondary.default }}>Tier configuration</Overline>
                    <Badge variant="lightgray">current tier : {viewProcessor?.currentTier ?? tier}</Badge>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing[600], marginBottom: spacing[400] }}>
                    <div>
                      <Body baseFontSize={13} style={{ fontWeight: 700, display: 'block', marginBottom: spacing[100] }}>Autoscaling</Body>
                      <Body baseFontSize={13} style={{ color: color.light.text.secondary.default }}>
                        Enable stream processors to automatically change tiers based on resource usage.{' '}
                        <Link href="#">View docs.</Link>
                      </Body>
                    </div>
                    <Toggle checked={autoscalingEnabled} onChange={(checked) => setAutoscalingEnabled(checked)} aria-label="Enable autoscaling" size="small" darkMode={false} disabled={!editMode} />
                  </div>
                  {autoscalingEnabled ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[400] }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing[600] }}>
                        <div>
                          <Body baseFontSize={13} style={{ fontWeight: 700, display: 'block', marginBottom: spacing[100] }}>Minimum tier</Body>
                          <Body baseFontSize={13} style={{ color: color.light.text.secondary.default }}>The lowest tier the stream processor can auto-scale down to.</Body>
                        </div>
                        <div className={viewFieldControlStyles}>
                          <Select label="" aria-label="Minimum tier" value={minTier} onChange={setMinTier} disabled={!editMode} size="small">
                            {TIER_OPTIONS.map(t => (
                              <Option key={t.value} value={t.value} description={`${t.description} ${t.price}`}>{t.label}</Option>
                            ))}
                          </Select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing[600] }}>
                        <div>
                          <Body baseFontSize={13} style={{ fontWeight: 700, display: 'block', marginBottom: spacing[100] }}>Maximum tier</Body>
                          <Body baseFontSize={13} style={{ color: color.light.text.secondary.default }}>The highest tier the stream processor can auto-scale up to.</Body>
                        </div>
                        <div className={viewFieldControlStyles}>
                          <Select label="" aria-label="Maximum tier" value={maxTier} onChange={setMaxTier} disabled={!editMode} size="small">
                            {TIER_OPTIONS.map(t => (
                              <Option key={t.value} value={t.value} description={`${t.description} ${t.price}`}>{t.label}</Option>
                            ))}
                          </Select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing[600] }}>
                        <div>
                          <Body baseFontSize={13} style={{ fontWeight: 700, display: 'block', marginBottom: spacing[100] }}>Starting tier</Body>
                          <Body baseFontSize={13} style={{ color: color.light.text.secondary.default }}>The tier the stream processor will start at once autoscaling initiates.</Body>
                        </div>
                        <div className={viewFieldControlStyles}>
                          <Select label="" aria-label="Starting tier" value={startingTier} onChange={setStartingTier} disabled={!editMode} size="small">
                            {TIER_OPTIONS.map(t => (
                              <Option key={t.value} value={t.value} description={`${t.description} ${t.price}`}>{t.label}</Option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing[600] }}>
                      <div>
                        <Body baseFontSize={13} style={{ fontWeight: 700, display: 'block', marginBottom: spacing[100] }}>Tier</Body>
                        <Body baseFontSize={13} style={{ color: color.light.text.secondary.default }}>Select the tier for this stream processor.</Body>
                      </div>
                      <div className={viewFieldControlStyles}>
                        <Select label="" aria-label="Tier" value={tier} onChange={val => setTier(val)} disabled={!editMode} size="small">
                          {TIER_OPTIONS.map(t => (
                            <Option key={t.value} value={t.value} description={`${t.description} ${t.price}`}>{t.label}</Option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ width: 'min(800px, 100%)', minWidth: 400 }}>
                <div className={serviceDetailsBodyStyles}>
                  <TextInput
                    label="Stream processor name"
                    placeholder="Enter name"
                    value={processorName}
                    onChange={e => setProcessorName(e.target.value)}
                    disabled={viewMode && !editMode}
                  />
                  <hr className={serviceDetailsDividerStyles} />
                  <Overline style={{ color: color.light.text.secondary.default, display: 'block' }}>
                    Tier configuration
                  </Overline>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[100] }}>
                  <Body baseFontSize={13} style={{ fontWeight: 700, display: 'block' }}>Autoscaling</Body>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[300] }}>
                    <Toggle
                      checked={autoscalingEnabled}
                      onChange={(checked) => setAutoscalingEnabled(checked)}
                      aria-label="Enable autoscaling"
                      size="xsmall"
                      darkMode={false}
                      disabled={viewMode && !editMode}
                    />
                    <Body baseFontSize={13}>
                      Enable stream processors to automatically change tiers based on resource usage.{' '}
                      <Link href="#">View docs.</Link>
                    </Body>
                  </div>
                  </div>
                  {autoscalingEnabled ? (
                    <>
                    <div style={{ display: 'flex', gap: spacing[400] }}>
                      <div style={{ flex: 1 }}>
                        <Select
                          label="Minimum tier"
                          description="The lowest tier the stream processor can auto-scale down to."
                          value={minTier}
                          onChange={val => setMinTier(val)}
                          disabled={viewMode && !editMode}
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
                          onChange={val => setMaxTier(val)}
                          disabled={viewMode && !editMode}
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
                    <div style={{ marginTop: spacing[100] }}>
                      <Select
                        label="Starting tier"
                        description="The tier the stream processor will start at once autoscaling initiates. The workspace default tier has been pre-selected."
                        value={startingTier}
                        onChange={val => setStartingTier(val)}
                        disabled={viewMode && !editMode}
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
                    <Select
                      label="Tier"
                      description="Select the tier for this stream processor. The workspace default tier has been pre-selected."
                      value={tier}
                      onChange={val => setTier(val)}
                      disabled={viewMode && !editMode}
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
                  )}
                  {!viewMode && (
                    <>
                      <hr className={serviceDetailsDividerStyles} />
                      <div style={{
                        background: color.light.background.secondary.default,
                        border: `1px solid ${color.light.border.secondary.default}`,
                        borderRadius: 12,
                        padding: 16,
                      }}>
                        <Checkbox
                          label="Start stream processor upon creation"
                          description="If checked, processor will run the moment it is created and billing will start immediately."
                          checked={startOnCreate}
                          onChange={e => setStartOnCreate(e.target.checked)}
                        />
                      </div>
                    </>
                  )}
                </div>
                </div>
              )}
            </DetailsCard>
          </div>

          <div className={expandableCardContainerStyles}>
            <DetailsCard title="Dead Letter Queue" optional defaultOpen={false}>
              {viewMode ? (
                <div>
                  <Body baseFontSize={13} style={{ color: color.light.text.secondary.default, display: 'block', marginBottom: 8 }}>
                    Specifies the destination for DLQ messages.
                  </Body>
                  <div className={viewFieldRowStyles}>
                    <span className={viewFieldLabelStyles}>Atlas Database Connection</span>
                    <div className={viewFieldControlStyles}>
                      <Select label="" aria-label="Atlas Database Connection" value={dlqConnection} onChange={val => setDlqConnection(val)} disabled={!editMode} size="small">
                        <Option value="connection1">connection1</Option>
                        <Option value="connection2">connection2</Option>
                      </Select>
                    </div>
                  </div>
                  <div className={viewFieldRowStyles}>
                    <span className={viewFieldLabelStyles}>Database name</span>
                    <div className={viewFieldControlStyles}>
                      <TextInput label="" aria-label="Database name" value={dlqDatabase} onChange={e => setDlqDatabase(e.target.value)} disabled={!editMode} sizeVariant="small" />
                    </div>
                  </div>
                  <div className={viewFieldRowStyles} style={{ borderBottom: 'none' }}>
                    <span className={viewFieldLabelStyles}>Collection name</span>
                    <div className={viewFieldControlStyles}>
                      <TextInput label="" aria-label="Collection name" value={dlqCollection} onChange={e => setDlqCollection(e.target.value)} disabled={!editMode} sizeVariant="small" />
                    </div>
                  </div>
                  {editMode && (
                    <Callout variant="note" darkMode={false}>
                      If the inputted database/collection does not exist, a new one will be created with the provided name(s).
                    </Callout>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Body baseFontSize={13} style={{ color: color.light.text.secondary.default }}>
                    Specify the destination connection (Atlas Database connections only), database, and collection for DLQ messages.
                  </Body>
                  <Select
                    label="Atlas database connection"
                    placeholder="Select connection"
                    value={dlqConnection}
                    onChange={val => setDlqConnection(val)}
                    state={showDlqError && !dlqConnection ? 'error' : 'none'}
                    errorMessage={showDlqError && !dlqConnection ? 'Atlas database connection is required.' : undefined}
                    disabled={viewMode && !editMode}
                  >
                    <Option value="connection1">connection1</Option>
                    <Option value="connection2">connection2</Option>
                  </Select>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <TextInput
                        label="Database name"
                        placeholder="Enter database name"
                        value={dlqDatabase}
                        onChange={e => setDlqDatabase(e.target.value)}
                        state={showDlqError && !dlqDatabase ? 'error' : 'none'}
                        errorMessage={showDlqError && !dlqDatabase ? 'Database name is required.' : undefined}
                        disabled={viewMode && !editMode}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <TextInput
                        label="Collection name"
                        placeholder="Enter collection name"
                        value={dlqCollection}
                        onChange={e => setDlqCollection(e.target.value)}
                        state={showDlqError && !dlqCollection ? 'error' : 'none'}
                        errorMessage={showDlqError && !dlqCollection ? 'Collection name is required.' : undefined}
                        disabled={viewMode && !editMode}
                      />
                    </div>
                  </div>
                  <Callout variant="note" darkMode={false}>
                    If the inputted database/collection does not exist, a new one will be created with the provided name(s).
                  </Callout>
                </div>
              )}
            </DetailsCard>
          </div>

          <div className={expandableCardContainerStyles}>
            <DetailsCard title="Advanced settings">
              <AdvancedSettingsContent failoverEnabled={failoverEnabled} onChange={setFailoverEnabled} disabled={viewMode && !editMode} />
            </DetailsCard>
          </div>
        </div>

        </>)}

        {view === 'json' && isImporting && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
            <PageLoader description="Importing JSON..." />
          </div>
        )}

        {view === 'json' && !isImporting && (
          <div className={contentWrapperStyles}>
            <div ref={editorContainerRef} style={{ position: 'relative', isolation: 'isolate', marginBottom: 60 }}>
              <CodeEditor
                language="json"
                value={jsonEditorContent}
                onChange={viewMode && !editMode ? undefined : setJsonEditorContent}
                readOnly={viewMode && !editMode}
                enableLineNumbers
                height={`${editorHeight}px`}
                minHeight="400px"
                maxHeight="720px"
                darkMode={false}
              >
                <CodeEditor.Panel
                  title="Stream Processing Pipeline"
                  showCopyButton
                  showFormatButton
                />
              </CodeEditor>
            </div>

            {!viewMode && (
              <div style={{
                background: color.light.background.secondary.default,
                border: `1px solid ${color.light.border.secondary.default}`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
              }}>
                <Checkbox
                  label="Start stream processor upon creation"
                  description="If checked, processor will run the moment it is created and billing will start immediately."
                  checked={startOnCreate}
                  onChange={e => setStartOnCreate(e.target.checked)}
                />
              </div>
            )}

            <div className={expandableCardContainerStyles}>
              <DetailsCard title="Advanced settings">
                <AdvancedSettingsContent failoverEnabled={failoverEnabled} onChange={setFailoverEnabled} disabled={viewMode && !editMode} />
              </DetailsCard>
            </div>
          </div>
        )}
      </div>

      {viewMode && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '28px 24px',
          flexShrink: 0,
          borderTop: `1px solid ${color.light.border.secondary.default}`,
          boxShadow: `0 -4px 12px color-mix(in srgb, ${palette.gray.dark1} 25%, transparent)`,
          background: palette.white,
        }}>
          {editMode ? (
            <>
              <Button variant="default" onClick={handleCancel}>Cancel</Button>
              <Button variant="primary" disabled={!hasEdits} onClick={handleSaveChanges}>Save changes</Button>
            </>
          ) : (
            <>
              <Button
                variant="default"
                leftGlyph={<Icon glyph={processorStatus === 'RUNNING' ? 'Stop' : 'Play'} />}
                onClick={() => setProcessorStatus(s => s === 'RUNNING' ? 'STOPPED' : 'RUNNING')}
              >
                {processorStatus === 'RUNNING' ? 'Stop processor' : 'Start processor'}
              </Button>
              <Button
                variant="default"
                leftGlyph={<Icon glyph="Edit" />}
                disabled={processorStatus === 'RUNNING'}
                onClick={handleEditClick}
              >
                Edit processor
              </Button>
            </>
          )}
        </div>
      )}

      {!viewMode && <div style={{ position: 'relative', flexShrink: 0 }}>
        {showDlqError && dlqPartiallyFilled && (
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 40,
            right: 272,
            display: 'flex',
            alignItems: 'center',
            zIndex: 10,
            pointerEvents: 'none',
          }}>
            <div style={{ pointerEvents: 'auto', width: '100%' }}>
              <Banner
                variant="danger"
                dismissible
                onClose={() => setShowDlqError(false)}
                darkMode={false}
              >
                All Dead Letter Queue fields must be filled in, or all left empty.
              </Banner>
            </div>
          </div>
        )}
        <FormFooter
          primaryButtonProps={{
            children: 'Create processor',
            disabled: isCreating || !sourceConnection || !sinkConnection || stages.length === 0 || !processorName.trim(),
            leftGlyph: isCreating ? (
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className={spinnerSvgStyles}>
                <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
                <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" fill="none" strokeDasharray="12 26" strokeLinecap="round" />
              </svg>
            ) : undefined,
            onClick: () => {
              if (dlqPartiallyFilled) {
                setShowDlqError(true)
                return
              }
              setIsCreating(true)
              setTimeout(() => {
                onCreateProcessor?.({
                  name: processorName.trim(),
                  status: startOnCreate ? 'RUNNING' : 'STOPPED',
                  currentTier: tier,
                  autoscalingEnabled,
                  failoverEnabled,
                })
              }, 2000)
            },
          }}
          cancelButtonProps={{ children: 'Cancel', onClick: handleCancel }}
          className={css`box-shadow: 0 -4px 12px color-mix(in srgb, ${palette.gray.dark1} 25%, transparent);`}
        />
      </div>}

      <Modal
        open={uploadModalOpen}
        setOpen={(open) => { setUploadModalOpen(open); if (!open) setUploadState('idle'); }}
        size="default"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <H3>Upload stream processor JSON file</H3>

          {/* Fixed-height container so modal doesn't resize between idle and uploading */}
          <div style={{ minHeight: uploadState === 'fileSelected' ? undefined : 280, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: uploadState === 'uploading' ? 'center' : 'flex-start' }}>

            {(uploadState === 'idle' || uploadState === 'fileSelected') && (
              <Banner variant="warning" darkMode={false}>
                Uploading a file will overwrite any JSON already written in the editor.
              </Banner>
            )}

            {uploadState === 'uploading' && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                <PageLoader description="Uploading stream processor..." />
              </div>
            )}

            {uploadState === 'idle' && (
              <div style={{
                border: `2px dashed ${color.light.border.secondary.default}`,
                borderRadius: 8,
                padding: '40px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                background: color.light.background.secondary.default,
              }}>
                <svg width="40" height="40" viewBox="0 -6 48 54" fill="none" xmlns="http://www.w3.org/2000/svg" overflow="visible">
                  <rect x="1" y="1" width="46" height="46" rx="10" fill="#00ED64" stroke="#001E2B" strokeWidth="2"/>
                  <line x1="24" y1="-10" x2="24" y2="30" stroke="#00684A" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M13 21 L24 32 L35 21" stroke="#00684A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Button variant="primaryOutline" size="small" onClick={() => {
                    setUploadState('uploading')
                    setTimeout(() => setUploadState('fileSelected'), 2000)
                  }}>Browse files</Button>
                  <Body baseFontSize={13} style={{ color: color.light.text.secondary.default }}>or drag and drop</Body>
                </div>
              </div>
            )}

          </div>

          {uploadState === 'fileSelected' && (
            <div>
<div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                border: `1px solid ${color.light.border.secondary.default}`,
                borderRadius: 8,
                background: color.light.background.secondary.default,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon glyph="File" size="small" style={{ color: palette.gray.dark1 }} />
                  <Body baseFontSize={13} style={{ fontWeight: 600 }}>processor1.json</Body>
                </div>
                <Button variant="default" size="xsmall" leftGlyph={<Icon glyph="Trash" size="small" />} aria-label="Remove file" onClick={() => setUploadState('idle')} />
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="default" onClick={() => { setUploadModalOpen(false); setUploadState('idle'); }}>Cancel</Button>
            <Button
              variant="primary"
              leftGlyph={<Icon glyph="Import" />}
              disabled={uploadState !== 'fileSelected'}
              onClick={() => {
                const importedJson = JSON.stringify({
                  name: "processor1",
                  tier: "SP30",
                  pipeline: [
                    {
                      $source: {
                        connectionName: "sample_solar",
                        timeField: { $date: "2024-01-01T00:00:00.000Z" }
                      }
                    },
                    {
                      $match: {
                        "reading.voltage": { $gt: 220 },
                        "reading.status": "active"
                      }
                    },
                    {
                      $tumblingWindow: {
                        size: { value: 5, unit: "minute" },
                        pipeline: [
                          {
                            $group: {
                              _id: "$deviceId",
                              avgVoltage: { $avg: "$reading.voltage" },
                              maxTemp: { $max: "$reading.temperature" },
                              count: { $sum: 1 }
                            }
                          }
                        ]
                      }
                    },
                    {
                      $sink: {
                        connectionName: "atlas_kafka",
                        db: "solar_analytics",
                        coll: "voltage_summaries"
                      }
                    }
                  ],
                  dlq: {
                    connectionName: "atlas_kafka",
                    db: "solar_analytics",
                    coll: "dead_letter_queue"
                  }
                }, null, 2)
                setUploadModalOpen(false)
                setUploadState('idle')
                setView('json')
                setIsImporting(true)
                setTimeout(() => {
                  setJsonEditorContent(importedJson)
                  tryParseJsonToVisual(importedJson)
                  setIsImporting(false)
                }, 1500)
              }}
            >Import JSON</Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        open={showCancelConfirm}
        setOpen={setShowCancelConfirm}
        variant="danger"
        title="Are you sure you want to stop your progress?"
        confirmButtonProps={{ children: 'Yes, delete progress', onClick: confirmCancel }}
        cancelButtonProps={{ onClick: () => setShowCancelConfirm(false) }}
      >
        Doing so will delete your progress on this stream processor.
      </ConfirmationModal>

      <ConfirmationModal
        open={showCheckpointConfirm}
        setOpen={setShowCheckpointConfirm}
        variant="danger"
        title="Checkpoint error"
        requiredInputText="Clear"
        confirmButtonProps={{
          children: 'Clear checkpoint',
          onClick: () => {
            setShowCheckpointConfirm(false)
            const name = processorName.trim() || (viewProcessor?.name ?? '')
            commitSave(() => {
              setEditMode(false)
              pushToast({
                variant: 'success',
                title: `Checkpoint cleared for "${name}".`,
                timeout: 6000,
              })
              setTimeout(() => {
                pushToast({
                  variant: 'success',
                  title: `Changes to "${name}" saved successfully.`,
                  timeout: 6000,
                })
              }, 500)
            })
          },
        }}
        cancelButtonProps={{ onClick: () => setShowCheckpointConfirm(false) }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span>The following changes require clearing the checkpoint in order to save:</span>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {checkpointReasons.includes('source') && <li><Body baseFontSize={13} style={{ fontWeight: 600 }}>Source modification</Body></li>}
            {checkpointReasons.includes('emit') && <li><Body baseFontSize={13} style={{ fontWeight: 600 }}>Emit stage</Body></li>}
          </ul>
          <span>
            Clearing the checkpoint may cause duplicate or missing records in your output collection. Confirm below to proceed. Your changes will be saved once the checkpoint is cleared.
          </span>
        </div>
      </ConfirmationModal>
    </div>
  )
}
