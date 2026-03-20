import { useEffect, useState } from 'react'

import './App.css'
import { StudioApp } from './features/studio/StudioApp'
import type { StudioPage } from './features/studio/types'

function pageFromPath(pathname: string): StudioPage {
  return pathname === '/design' || pathname === '/chat' ? 'design' : 'search'
}

function App() {
  const [page, setPage] = useState<StudioPage>(() => pageFromPath(window.location.pathname))

  useEffect(() => {
    if (window.location.pathname === '/chat') {
      window.history.replaceState({}, '', '/design')
      setPage('design')
    } else if (window.location.pathname !== '/search' && window.location.pathname !== '/design') {
      window.history.replaceState({}, '', '/search')
      setPage('search')
    }

    const onPopState = () => setPage(pageFromPath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const onChangePage = (nextPage: StudioPage) => {
    const nextPath = `/${nextPage}`
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
    setPage(nextPage)
  }

  return <StudioApp page={page} onChangePage={onChangePage} />
}

export default App
