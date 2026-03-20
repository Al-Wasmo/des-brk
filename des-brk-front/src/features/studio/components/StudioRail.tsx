import { BrandIcon, ChatIcon, SearchIcon, SettingsIcon, WorkspaceIcon } from './icons'
import type { StudioPage } from '../types'

type StudioRailProps = {
  page: StudioPage
  onChangePage: (page: StudioPage) => void
  isWorkspacePanelOpen: boolean
  onToggleWorkspacePanel: () => void
}

export function StudioRail({ page, onChangePage, isWorkspacePanelOpen, onToggleWorkspacePanel }: StudioRailProps) {
  return (
    <nav className="rail">
      <div className="rail-brand" aria-hidden="true">
        <BrandIcon />
      </div>

      <button
        type="button"
        className={`rail-item ${isWorkspacePanelOpen ? 'active' : ''}`}
        title="Workspaces"
        onClick={onToggleWorkspacePanel}
      >
        <WorkspaceIcon />
      </button>

      <button
        type="button"
        className={`rail-item ${page === 'search' ? 'active' : ''}`}
        title="Design Search"
        onClick={() => onChangePage('search')}
      >
        <SearchIcon />
      </button>

      <button
        type="button"
        className={`rail-item ${page === 'design' ? 'active' : ''}`}
        title="Design Flow"
        onClick={() => onChangePage('design')}
      >
        <ChatIcon />
      </button>

      <div className="rail-spacer" />

      <button type="button" className="rail-item" title="Settings">
        <SettingsIcon />
      </button>
    </nav>
  )
}
