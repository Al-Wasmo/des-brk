import { useState } from 'react'

import type { Workspace } from '../../../api/workspaces/types'
import { BinIcon } from './icons'

type WorkspacePanelProps = {
  isOpen: boolean
  activeWorkspaceId: number | null
  workspaces: Workspace[]
  isLoading: boolean
  isCreating: boolean
  isDeletingWorkspaceId: number | null
  onSelectWorkspace: (workspaceId: number) => void
  onCreateWorkspace: (name?: string) => Promise<void>
  onDeleteWorkspace: (workspaceId: number) => Promise<void>
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown update time'
  }

  return date.toLocaleString()
}

export function WorkspacePanel({
  isOpen,
  activeWorkspaceId,
  workspaces,
  isLoading,
  isCreating,
  isDeletingWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
}: WorkspacePanelProps) {
  const [workspaceName, setWorkspaceName] = useState('')

  async function handleCreateWorkspace() {
    const nextName = workspaceName.trim()
    try {
      await onCreateWorkspace(nextName || undefined)
      setWorkspaceName('')
    } catch {
      // Handled by parent toast.
    }
  }

  async function handleDeleteWorkspace(workspaceId: number) {
    try {
      await onDeleteWorkspace(workspaceId)
    } catch {
      // Handled by parent toast.
    }
  }

  return (
    <aside className={`workspace-panel ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
      <div className="workspace-panel-head">
        <h2>Workspaces</h2>
        <p>Create separate context and pipeline tracks.</p>
      </div>

      <div className="workspace-create-row">
        <input
          type="text"
          className="workspace-name-input"
          placeholder="Workspace name"
          value={workspaceName}
          onChange={(event) => setWorkspaceName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void handleCreateWorkspace()
            }
          }}
          disabled={isCreating}
        />
        <button type="button" className="btn btn-primary" onClick={() => void handleCreateWorkspace()} disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create'}
        </button>
      </div>

      <div className="workspace-list" role="list">
        {isLoading ? <p className="workspace-empty">Loading workspaces...</p> : null}

        {!isLoading && workspaces.length === 0 ? <p className="workspace-empty">No workspaces yet.</p> : null}

        {workspaces.map((workspace) => {
          const isActive = workspace.id === activeWorkspaceId
          return (
            <div key={workspace.id} className={`workspace-item ${isActive ? 'active' : ''}`} role="listitem">
              <button type="button" className="workspace-item-select" onClick={() => onSelectWorkspace(workspace.id)}>
                <div className="workspace-item-row">
                  <span className="workspace-item-name">{workspace.name}</span>
                </div>
                <span className="workspace-item-meta">Updated {formatTimestamp(workspace.updated_at)}</span>
              </button>
              <button
                type="button"
                className="workspace-delete-btn"
                aria-label={`Delete ${workspace.name}`}
                onClick={() => void handleDeleteWorkspace(workspace.id)}
                disabled={isDeletingWorkspaceId === workspace.id}
              >
                <BinIcon />
              </button>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
