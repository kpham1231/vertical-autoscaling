import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'
import LeafyGreenProvider from '@leafygreen-ui/leafygreen-provider'
import './index.css'
import App from './App.tsx'

// react-transition-group uses ReactDOM.findDOMNode which was removed in React 19.
// Polyfill it so LeafyGreen's Toast animations don't crash.
if (typeof (ReactDOM as any).findDOMNode !== 'function') {
  (ReactDOM as any).findDOMNode = function(inst: any): Element | null {
    if (inst == null) return null
    if (inst instanceof Element) return inst
    const fiber = (inst as any)._reactInternals
    if (!fiber) return null
    let f = fiber
    while (f) {
      if (f.stateNode instanceof Element) return f.stateNode
      f = f.child || null
    }
    return null
  }
}

createRoot(document.getElementById('root')!).render(
  <LeafyGreenProvider darkMode={false}>
    <App />
  </LeafyGreenProvider>,
)
