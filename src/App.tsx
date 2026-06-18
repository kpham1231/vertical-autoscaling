import { useState } from 'react'
import { css, injectGlobal } from '@leafygreen-ui/emotion'
import { ToastProvider, useToast } from '@leafygreen-ui/toast'
import { spacing } from '@leafygreen-ui/tokens'
import { Sidebar, type ActiveNav } from './components/Sidebar'
import { TopNav } from './components/TopNav'
import { StreamProcessorsPage, type StreamProcessor } from './components/StreamProcessorsPage'
import { CreateStreamProcessorPage } from './components/CreateStreamProcessorPage'
import { MonitoringPage } from './components/MonitoringPage'

injectGlobal`
  #lg-toast-region {
    bottom: 72px !important;
    left: 72px !important;
  }
  dialog[open] {
    margin-top: 80px !important;
    margin-bottom: auto !important;
    top: 0 !important;
    transform: none !important;
  }
`

const toastPortalStyles = css`
  bottom: 72px !important;
  left: 72px !important;
`

const appStyles = css`
  display: flex;
  flex-direction: row;
  height: 100vh;
  overflow: hidden;
`

const rightPanelStyles = css`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`

const contentStyles = css`
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`

type View = 'list' | 'create'

const defaultProcessors: StreamProcessor[] = [
  { name: 'spTest', status: 'RUNNING', currentTier: 'SP30' },
]

function AppContent() {
  const { pushToast } = useToast()
  const [activeNav, setActiveNav] = useState<ActiveNav>('stream-processors')
  const [view, setView] = useState<View>('list')
  const [processors, setProcessors] = useState<StreamProcessor[]>(defaultProcessors)
  const [selectedProcessor, setSelectedProcessor] = useState<StreamProcessor | null>(null)

  const handleNavigate = (item: ActiveNav) => {
    setActiveNav(item)
    setView('list')
    setSelectedProcessor(null)
  }

  const handleStatusChange = (name: string, status: StreamProcessor['status']) => {
    setProcessors(prev => prev.map(p => p.name === name ? { ...p, status } : p))
  }

  const handleDeleteProcessor = (name: string) => {
    setProcessors(prev => prev.filter(p => p.name !== name))
  }

  const handleTierChange = (name: string, tier: string) => {
    setProcessors(prev => prev.map(p => p.name === name ? { ...p, currentTier: tier } : p))
  }

  const handleCreateProcessor = (processor: StreamProcessor) => {
    setProcessors(prev => [processor, ...prev])
    setView('list')
    pushToast({
      variant: 'success',
      title: `"${processor.name}" created successfully.`,
      timeout: 6000,
    })
  }

  return (
    <div className={appStyles}>
      <Sidebar activeItem={activeNav} onNavigate={handleNavigate} />
      <div className={rightPanelStyles}>
        <TopNav />
        <div className={contentStyles}>
          {activeNav === 'stream-processors' && view === 'list' && (
            <StreamProcessorsPage
              onCreateClick={() => setView('create')}
              processors={processors}
              onRowClick={(p) => { setSelectedProcessor(p); setView('create') }}
              onStatusChange={handleStatusChange}
              onDeleteProcessor={handleDeleteProcessor}
              onTierChange={handleTierChange}
            />
          )}
          {activeNav === 'stream-processors' && view === 'create' && (
            <CreateStreamProcessorPage
              onBack={() => { setView('list'); setSelectedProcessor(null) }}
              onCreateProcessor={handleCreateProcessor}
              viewMode={!!selectedProcessor}
              viewProcessor={selectedProcessor ?? undefined}
            />
          )}
          {activeNav === 'monitoring' && <MonitoringPage processors={processors} />}
          {activeNav !== 'stream-processors' && activeNav !== 'monitoring' && (
            <div style={{ flex: 1, padding: `${spacing[600]}px ${spacing[1000]}px` }}>
              <h2 style={{ fontFamily: "'MongoDB Value Serif', Georgia, serif", textTransform: 'capitalize' }}>
                {activeNav.replace(/-/g, ' ')}
              </h2>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <ToastProvider portalClassName={toastPortalStyles}>
      <AppContent />
    </ToastProvider>
  )
}

export default App
