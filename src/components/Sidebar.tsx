import { useState } from 'react'
import { css } from '@leafygreen-ui/emotion'
import { palette } from '@leafygreen-ui/palette'
import { color, spacing } from '@leafygreen-ui/tokens'
import Icon from '@leafygreen-ui/icon'

const borderSecondary = color.light.border.secondary.default

const wrapperStyles = css`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
`

const headerRowStyles = css`
  display: flex;
  align-items: center;
  height: 50px;
  flex-shrink: 0;
  border-bottom: 1px solid ${borderSecondary};
`

const logoSlotStyles = css`
  width: 48px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${palette.gray.light3};
  border-right: 1px solid ${borderSecondary};
`

const sidebarTitleStyles = css`
  padding: 0 ${spacing[400]}px;
  font-size: 15px;
  font-weight: 600;
  color: ${palette.gray.dark1};
  white-space: nowrap;
`

const bodyRowStyles = css`
  display: flex;
  flex: 1;
  min-height: 0;
  position: relative;
`

const iconRailStyles = css`
  width: 48px;
  background: ${palette.gray.light3};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${spacing[100]}px 0;
  flex-shrink: 0;
  border-right: 1px solid ${borderSecondary};
  z-index: 1;
`

const railIconStyles = css`
  width: 48px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${palette.gray.dark1};
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: ${palette.gray.light2};
  }
`

const activeRailIconStyles = css`
  ${railIconStyles}
  color: ${palette.green.dark2};
  background: #e3fcf7;
  border-left: 3px solid ${palette.green.base};
`

const sideNavPanelStyles = css`
  width: 184px;
  background: ${palette.white};
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${borderSecondary};
`

const navItemStyles = css`
  display: block;
  width: 100%;
  padding: ${spacing[200]}px ${spacing[400]}px;
  font-family: inherit;
  font-size: 13px;
  color: ${palette.gray.dark2};
  cursor: pointer;
  background: none;
  border: none;
  text-align: left;
  border-radius: 0;
  transition: background 0.1s;
  &:hover {
    background: ${palette.gray.light2};
  }
`

const activeNavItemStyles = css`
  ${navItemStyles}
  color: ${palette.green.dark2};
  background: #e3fcf7;
  font-weight: 600;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${palette.green.dark1};
    border-radius: 0 6px 6px 0;
  }
  &:hover {
    background: #e3fcf7;
  }
`

// ── Flyout ────────────────────────────────────────────────────────────────────

const flyoutOverlayStyles = css`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 240px;
  background: ${color.light.background.secondary.default};
  border-right: 1px solid ${borderSecondary};
  z-index: 50;
  overflow-y: auto;
  transform: translateX(-8px);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.18s ease, opacity 0.18s ease;
  box-shadow: 4px 0 12px rgba(0,0,0,0.08);
`

const flyoutOverlayOpenStyles = css`
  transform: translateX(0);
  opacity: 1;
  pointer-events: all;
`

const flyoutSectionHeaderStyles = css`
  display: flex;
  align-items: center;
  gap: ${spacing[200]}px;
  padding: ${spacing[300]}px ${spacing[400]}px ${spacing[100]}px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${palette.green.dark2};
`

const flyoutItemStyles = css`
  display: block;
  width: 100%;
  padding: 7px 16px 7px 24px;
  font-family: inherit;
  font-size: 13px;
  color: ${palette.gray.dark2};
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.1s;
  &:hover {
    background: ${color.light.background.secondary.hover};
  }
`

const flyoutActiveItemStyles = css`
  ${flyoutItemStyles}
  color: ${palette.green.dark2};
  background: #e3fcf7;
  font-weight: 600;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${palette.green.dark1};
    border-radius: 0 4px 4px 0;
  }
  &:hover {
    background: #d4f7ef;
  }
`

const flyoutDividerStyles = css`
  border: none;
  border-top: 1px solid ${borderSecondary};
  margin: ${spacing[100]}px 0;
`

const flyoutCollapseRowStyles = css`
  display: flex;
  justify-content: flex-end;
  padding: ${spacing[200]}px ${spacing[300]}px;
  border-top: 1px solid ${borderSecondary};
  flex-shrink: 0;
`

function MongoLeaf({ size = 22 }: { size?: number }) {
  const h = size * (26 / 22)
  return (
    <svg width={size} height={h} viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.156 0C11.156 0 4.344 8.232 4.344 14.976C4.344 18.576 7.084 21.84 11.156 22.968C15.228 21.84 17.968 18.576 17.968 14.976C17.968 8.232 11.156 0 11.156 0Z" fill={palette.green.dark1}/>
      <path d="M11.156 22.968V26C11.156 26 9.548 25.012 9.548 22.76V22.384C10.092 22.608 10.62 22.8 11.156 22.968Z" fill={palette.green.dark2}/>
      <path d="M11.156 22.968V26C11.156 26 12.764 25.012 12.764 22.76V22.384C12.22 22.608 11.692 22.8 11.156 22.968Z" fill={palette.green.dark1}/>
    </svg>
  )
}

// ── Full-nav panel ─────────────────────────────────────────────────────────────

const fullNavPanelStyles = css`
  width: 240px;
  background: ${color.light.background.secondary.default};
  border-right: 1px solid ${borderSecondary};
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
`

function FullNavContent({
  onStreamProcessingClick,
  closeFlyout,
}: {
  onStreamProcessingClick?: () => void
  closeFlyout?: () => void
}) {
  return (
    <>
      <div style={{ borderBottom: `1px solid ${borderSecondary}`, padding: '4px 0' }}>
        <div className={flyoutItemStyles} style={{ paddingLeft: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span>Project Overview</span>
          <Icon glyph="Settings" size="small" style={{ color: palette.gray.dark1 }} />
        </div>
      </div>

      {flyoutSections.map((section) => (
        <div key={section.id}>
          <div className={flyoutSectionHeaderStyles}>
            <Icon glyph={section.icon} size="small" />
            <span>{section.label}</span>
            <Icon glyph="CaretUp" size="small" style={{ marginLeft: 'auto' }} />
          </div>
          {section.items.map((item) => {
            const isActive = section.id === 'streaming-data' && item === 'Stream Processing'
            const handleClick = isActive
              ? () => { closeFlyout?.(); onStreamProcessingClick?.() }
              : undefined
            return (
              <div key={item} className={isActive ? flyoutActiveItemStyles : flyoutItemStyles} onClick={handleClick}>
                {item}
              </div>
            )
          })}
          <hr className={flyoutDividerStyles} />
        </div>
      ))}

      <div className={flyoutCollapseRowStyles}>
        <Icon glyph="SideNav" size="default" style={{ color: palette.gray.dark1, cursor: 'pointer' }} />
      </div>
    </>
  )
}

export type ActiveNav = 'stream-processors' | 'monitoring' | 'connection-registry'

interface SidebarProps {
  activeItem: ActiveNav
  onNavigate: (item: ActiveNav) => void
  onStreamProcessingClick?: () => void
  showFullNav?: boolean
}

const navItems: { id: ActiveNav; label: string }[] = [
  { id: 'stream-processors', label: 'Stream Processors' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'connection-registry', label: 'Connection Registry' },
]

const flyoutSections = [
  {
    id: 'database',
    label: 'Database',
    icon: 'Database' as const,
    items: ['Clusters', 'Search & Vector Search', 'Data Explorer', 'Backup'],
  },
  {
    id: 'streaming-data',
    label: 'Streaming Data',
    icon: 'Streaming' as const,
    items: ['Stream Processing', 'Triggers'],
  },
  {
    id: 'services',
    label: 'Services',
    icon: 'Apps' as const,
    items: ['AI Models', 'Migration', 'Data Federation', 'Visualization', 'Data API', 'Device Sync'],
  },
  {
    id: 'security',
    label: 'Security',
    icon: 'Lock' as const,
    items: ['Project Identity & Access', 'Database & Network Access', 'Activity Feed'],
  },
]

export function Sidebar({ activeItem, onNavigate, onStreamProcessingClick, showFullNav }: SidebarProps) {
  const [flyoutOpen, setFlyoutOpen] = useState(false)

  return (
    <div className={wrapperStyles}>
      <div className={headerRowStyles}>
        <div className={logoSlotStyles}>
          <MongoLeaf />
        </div>
        <span className={sidebarTitleStyles}>Stream Processing</span>
      </div>

      <div className={bodyRowStyles}>
        {showFullNav ? (
          <div className={fullNavPanelStyles}>
            <FullNavContent onStreamProcessingClick={onStreamProcessingClick} />
          </div>
        ) : (
          <>
            <div
              className={iconRailStyles}
              onMouseEnter={() => setFlyoutOpen(true)}
              onMouseLeave={() => setFlyoutOpen(false)}
            >
              <div className={railIconStyles} title="Database">
                <Icon glyph="Database" size="default" />
              </div>
              <div className={activeRailIconStyles} title="Streaming Data">
                <Icon glyph="Streaming" size="default" />
              </div>
              <div className={railIconStyles} title="Services">
                <Icon glyph="Apps" size="default" />
              </div>
              <div className={railIconStyles} title="Security">
                <Icon glyph="Lock" size="default" />
              </div>
            </div>

            <div className={sideNavPanelStyles}>
              {navItems.map(({ id, label }) => (
                <button
                  key={id}
                  className={activeItem === id ? activeNavItemStyles : navItemStyles}
                  onClick={() => onNavigate(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              className={`${flyoutOverlayStyles} ${flyoutOpen ? flyoutOverlayOpenStyles : ''}`}
              onMouseEnter={() => setFlyoutOpen(true)}
              onMouseLeave={() => setFlyoutOpen(false)}
            >
              <FullNavContent
                onStreamProcessingClick={onStreamProcessingClick}
                closeFlyout={() => setFlyoutOpen(false)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
