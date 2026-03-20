import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useSearchDesignsMutation } from '../../api/designs/queries'
import type { DesignItem } from '../../api/designs/types'
import {
  useAddWorkspaceContextItemMutation,
  useCreateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useRemoveWorkspaceContextItemMutation,
  useUpdateWorkspaceStateMutation,
  useWorkspaceContextItemsQuery,
  useWorkspacesQuery,
} from '../../api/workspaces/queries'
import type { Workspace, WorkspaceState } from '../../api/workspaces/types'
import { DesignPage, type DesignPipelineState } from './components/DesignPage'
import { ImagePreviewModal } from './components/ImagePreviewModal'
import { SearchPage } from './components/SearchPage'
import { StudioRail } from './components/StudioRail'
import { Toast } from './components/Toast'
import { WorkspacePanel } from './components/WorkspacePanel'
import type { AssetItem, AssetTone, StudioPage } from './types'

const tones: AssetTone[] = ['c1', 'c2', 'c3', 'c4', 'c5']
const ACTIVE_WORKSPACE_STORAGE_KEY = 'studio-active-workspace-v1'
const EMPTY_WORKSPACES: Workspace[] = []

type WorkspaceSearchState = {
  searchInput: string
  assets: AssetItem[]
}

function withExtension(name: string) {
  if (/\.[a-zA-Z0-9]+$/.test(name)) {
    return name
  }
  return `${name}.png`
}

function toAssetItem(item: DesignItem, index: number): AssetItem {
  const normalizedName = item.name?.trim() || `design-${item.id}`

  return {
    id: item.id,
    name: normalizedName,
    fileName: withExtension(normalizedName),
    meta: 'Design · PNG',
    tone: tones[index % tones.length],
    href: item.href,
    thumbnailUrl: item.thumbnail_url,
    localImagePath: item.local_image_path,
    previewUrl: item.thumbnail_url,
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  return 'Request failed'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAssetTone(value: unknown): value is AssetTone {
  return value === 'c1' || value === 'c2' || value === 'c3' || value === 'c4' || value === 'c5'
}

function isAssetItem(value: unknown): value is AssetItem {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.fileName === 'string' &&
    typeof value.meta === 'string' &&
    isAssetTone(value.tone) &&
    typeof value.href === 'string' &&
    (typeof value.thumbnailUrl === 'string' || value.thumbnailUrl === null) &&
    (typeof value.localImagePath === 'string' || value.localImagePath === null) &&
    (typeof value.previewUrl === 'string' || value.previewUrl === null)
  )
}

function normalizeWorkspaceState(value: WorkspaceState | null): WorkspaceState {
  if (!isRecord(value)) {
    return {}
  }
  return { ...value }
}

function readWorkspaceSearchState(value: unknown): WorkspaceSearchState {
  if (!isRecord(value)) {
    return { searchInput: '', assets: [] }
  }

  const searchInput = typeof value.searchInput === 'string' ? value.searchInput : ''
  const assets = Array.isArray(value.assets) ? value.assets.filter(isAssetItem) : []

  return { searchInput, assets }
}

function readWorkspaceDesignState(value: unknown): Partial<DesignPipelineState> | null {
  if (!isRecord(value)) {
    return null
  }
  return value as Partial<DesignPipelineState>
}

type StudioAppProps = {
  page: StudioPage
  onChangePage: (page: StudioPage) => void
}

export function StudioApp({ page, onChangePage }: StudioAppProps) {
  const [searchInput, setSearchInput] = useState('')
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [pendingAddIds, setPendingAddIds] = useState<Set<number>>(new Set())
  const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<number>>(new Set())
  const [previewAsset, setPreviewAsset] = useState<AssetItem | null>(null)

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(null)
  const [isWorkspaceStateHydrated, setIsWorkspaceStateHydrated] = useState(false)
  const [isWorkspacePanelOpen, setIsWorkspacePanelOpen] = useState(false)

  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  const toastTimerRef = useRef<number | undefined>(undefined)
  const statePersistTimerRef = useRef<number | undefined>(undefined)
  const workspaceStateRef = useRef<WorkspaceState>({})
  const lastPersistedStateRef = useRef('')
  const pendingPersistRef = useRef<{ workspaceId: number; state: WorkspaceState; signature: string } | null>(null)
  const hasInitializedWorkspaceSelectionRef = useRef(false)
  const hydratedWorkspaceIdRef = useRef<number | null>(null)

  const searchMutation = useSearchDesignsMutation()

  const workspacesQuery = useWorkspacesQuery()
  const createWorkspaceMutation = useCreateWorkspaceMutation()
  const deleteWorkspaceMutation = useDeleteWorkspaceMutation()
  const updateWorkspaceStateMutation = useUpdateWorkspaceStateMutation()
  const updateWorkspaceState = updateWorkspaceStateMutation.mutate

  const contextQuery = useWorkspaceContextItemsQuery(activeWorkspaceId)
  const addContextMutation = useAddWorkspaceContextItemMutation()
  const removeContextMutation = useRemoveWorkspaceContextItemMutation()

  const workspaces = useMemo(() => workspacesQuery.data ?? EMPTY_WORKSPACES, [workspacesQuery.data])
  const activeWorkspace = useMemo(
    () => workspaces.find((item) => item.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId],
  )
  const isWorkspaceReady = Boolean(activeWorkspace) && isWorkspaceStateHydrated

  const designPipelineState = useMemo(() => {
    if (!activeWorkspace) {
      return null
    }
    const state = normalizeWorkspaceState(activeWorkspace.state_json)
    return readWorkspaceDesignState(state.designPipeline)
  }, [activeWorkspace])

  const contextAssets = useMemo(() => {
    const items = contextQuery.data ?? []
    return items.map((entry, index) => toAssetItem(entry.image, index))
  }, [contextQuery.data])

  const contextAssetIds = useMemo(() => {
    return new Set((contextQuery.data ?? []).map((item) => item.image_asset_id))
  }, [contextQuery.data])

  function showToastMessage(message: string) {
    setToastMessage(message)
    setShowToast(true)

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }

    toastTimerRef.current = window.setTimeout(() => {
      setShowToast(false)
    }, 2200)
  }

  const persistWorkspaceStateNow = useCallback(
    (workspaceId: number, state: WorkspaceState, signature: string) => {
      updateWorkspaceState(
        {
          workspaceId,
          state,
        },
        {
          onSuccess: () => {
            lastPersistedStateRef.current = signature
          },
          onError: (error) => {
            showToastMessage('Workspace autosave failed: ' + toErrorMessage(error))
          },
        },
      )
    },
    [updateWorkspaceState],
  )

  const flushPendingWorkspaceState = useCallback(() => {
    if (statePersistTimerRef.current) {
      window.clearTimeout(statePersistTimerRef.current)
      statePersistTimerRef.current = undefined
    }

    const pending = pendingPersistRef.current
    if (!pending) {
      return
    }

    pendingPersistRef.current = null
    persistWorkspaceStateNow(pending.workspaceId, pending.state, pending.signature)
  }, [persistWorkspaceStateNow])

  const queueWorkspaceState = useCallback(
    (nextState: WorkspaceState) => {
      if (!isWorkspaceStateHydrated || typeof activeWorkspaceId !== 'number') {
        return
      }

      const signature = JSON.stringify(nextState)
      workspaceStateRef.current = nextState

      if (signature === lastPersistedStateRef.current) {
        return
      }

      pendingPersistRef.current = {
        workspaceId: activeWorkspaceId,
        state: nextState,
        signature,
      }

      if (statePersistTimerRef.current) {
        window.clearTimeout(statePersistTimerRef.current)
      }

      statePersistTimerRef.current = window.setTimeout(() => {
        const pending = pendingPersistRef.current
        if (!pending) {
          return
        }

        pendingPersistRef.current = null
        persistWorkspaceStateNow(pending.workspaceId, pending.state, pending.signature)
      }, 420)
    },
    [isWorkspaceStateHydrated, activeWorkspaceId, persistWorkspaceStateNow],
  )

  const queueWorkspacePatch = useCallback(
    (patch: WorkspaceState) => {
      const nextState: WorkspaceState = {
        ...workspaceStateRef.current,
        ...patch,
      }
      queueWorkspaceState(nextState)
    },
    [queueWorkspaceState],
  )

  const onDesignPipelineStateChange = useCallback(
    (nextState: DesignPipelineState) => {
      queueWorkspacePatch({
        designPipeline: nextState,
      })
    },
    [queueWorkspacePatch],
  )

  useEffect(() => {
    if (!workspacesQuery.isSuccess) {
      return
    }

    if (workspaces.length === 0) {
      setIsWorkspacePanelOpen(true)
    }
  }, [workspacesQuery.isSuccess, workspaces.length])

  useEffect(() => {
    if (!workspacesQuery.isSuccess || workspaces.length === 0) {
      return
    }

    if (!hasInitializedWorkspaceSelectionRef.current) {
      hasInitializedWorkspaceSelectionRef.current = true
      let preferredWorkspaceId: number | null = null

      try {
        const raw = localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY)
        const parsed = Number(raw)
        if (Number.isInteger(parsed)) {
          preferredWorkspaceId = parsed
        }
      } catch {
        // Ignore invalid stored workspace id.
      }

      const nextWorkspaceId =
        typeof preferredWorkspaceId === 'number' && workspaces.some((item) => item.id === preferredWorkspaceId)
          ? preferredWorkspaceId
          : workspaces[0].id

      setActiveWorkspaceId((prev) => (prev === nextWorkspaceId ? prev : nextWorkspaceId))
      if (activeWorkspaceId !== nextWorkspaceId) {
        setIsWorkspaceStateHydrated(false)
      }
      return
    }

    if (typeof activeWorkspaceId === 'number' && workspaces.some((item) => item.id === activeWorkspaceId)) {
      return
    }

    const fallbackWorkspaceId = workspaces[0].id
    setActiveWorkspaceId((prev) => (prev === fallbackWorkspaceId ? prev : fallbackWorkspaceId))
    if (activeWorkspaceId !== fallbackWorkspaceId) {
      setIsWorkspaceStateHydrated(false)
    }
  }, [workspacesQuery.isSuccess, workspaces, activeWorkspaceId])

  useEffect(() => {
    if (typeof activeWorkspaceId !== 'number') {
      return
    }

    try {
      localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, String(activeWorkspaceId))
    } catch {
      // Ignore storage errors.
    }
  }, [activeWorkspaceId])

  useEffect(() => {
    if (typeof activeWorkspaceId !== 'number') {
      hydratedWorkspaceIdRef.current = null
      if (isWorkspaceStateHydrated) {
        setIsWorkspaceStateHydrated(false)
      }
      return
    }

    if (hydratedWorkspaceIdRef.current === activeWorkspaceId) {
      return
    }

    const workspace = workspaces.find((item) => item.id === activeWorkspaceId)
    if (!workspace) {
      return
    }

    const workspaceState = normalizeWorkspaceState(workspace.state_json)
    workspaceStateRef.current = workspaceState
    lastPersistedStateRef.current = JSON.stringify(workspaceState)
    pendingPersistRef.current = null

    if (statePersistTimerRef.current) {
      window.clearTimeout(statePersistTimerRef.current)
      statePersistTimerRef.current = undefined
    }

    const searchState = readWorkspaceSearchState(workspaceState.search)

    setSearchInput(searchState.searchInput)
    setAssets(searchState.assets)
    setPendingAddIds(new Set())
    setPendingRemoveIds(new Set())

    hydratedWorkspaceIdRef.current = activeWorkspaceId
    setIsWorkspaceStateHydrated(true)
  }, [activeWorkspaceId, workspaces, isWorkspaceStateHydrated])

  function toggleAsset(id: number, isInContext: boolean) {
    if (isInContext) {
      setPendingRemoveIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
      return
    }

    setPendingAddIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function onSearchClick() {
    const topic = searchInput.trim()
    if (!topic) {
      showToastMessage('Type a topic first')
      return
    }

    searchMutation.mutate(
      { topic },
      {
        onSuccess: (response) => {
          const nextAssets = response.items.map((item, index) => toAssetItem(item, index))
          setAssets(nextAssets)
          setPendingAddIds(new Set())
          setPendingRemoveIds(new Set())
          queueWorkspacePatch({
            search: {
              searchInput,
              assets: nextAssets,
            },
          })
          showToastMessage(`${response.count} result${response.count === 1 ? '' : 's'} loaded`)
        },
        onError: (error) => {
          showToastMessage(toErrorMessage(error))
        },
      },
    )
  }

  function onSearchInputChange(value: string) {
    setSearchInput(value)
    queueWorkspacePatch({
      search: {
        searchInput: value,
        assets,
      },
    })
  }

  async function saveToContext() {
    if (typeof activeWorkspaceId !== 'number') {
      showToastMessage('Select a workspace first')
      return
    }

    try {
      const contextMap = new Map((contextQuery.data ?? []).map((item) => [item.image_asset_id, item.id]))

      const addCalls = [...pendingAddIds].map((imageAssetId) =>
        addContextMutation.mutateAsync({
          workspaceId: activeWorkspaceId,
          image_asset_id: imageAssetId,
        }),
      )

      const removeCalls = [...pendingRemoveIds]
        .map((imageAssetId) => contextMap.get(imageAssetId))
        .filter((contextItemId): contextItemId is number => typeof contextItemId === 'number')
        .map((contextItemId) =>
          removeContextMutation.mutateAsync({
            workspaceId: activeWorkspaceId,
            contextItemId,
          }),
        )

      if (addCalls.length === 0 && removeCalls.length === 0) {
        showToastMessage('No context changes')
        return
      }

      await Promise.all([...addCalls, ...removeCalls])
      setPendingAddIds(new Set())
      setPendingRemoveIds(new Set())
      showToastMessage('Saved to context')
    } catch (error) {
      showToastMessage(toErrorMessage(error))
    }
  }

  function removeFromContext(imageAssetId: number) {
    if (typeof activeWorkspaceId !== 'number') {
      return
    }

    const entry = (contextQuery.data ?? []).find((item) => item.image_asset_id === imageAssetId)
    if (!entry) {
      return
    }

    removeContextMutation.mutate(
      {
        workspaceId: activeWorkspaceId,
        contextItemId: entry.id,
      },
      {
        onSuccess: () => {
          setPendingRemoveIds((prev) => {
            const next = new Set(prev)
            next.delete(imageAssetId)
            return next
          })
        },
        onError: (error) => {
          showToastMessage(toErrorMessage(error))
        },
      },
    )
  }

  async function createWorkspaceAndSelect(name?: string) {
    try {
      flushPendingWorkspaceState()
      const created = await createWorkspaceMutation.mutateAsync({ name })
      setActiveWorkspaceId(created.id)
      setIsWorkspaceStateHydrated(false)
      setIsWorkspacePanelOpen(false)
      showToastMessage('Workspace created')
    } catch (error) {
      showToastMessage(toErrorMessage(error))
      throw error
    }
  }

  async function deleteWorkspaceById(workspaceId: number) {
    try {
      flushPendingWorkspaceState()
      await deleteWorkspaceMutation.mutateAsync(workspaceId)

      if (workspaceId === activeWorkspaceId) {
        setActiveWorkspaceId(null)
        setIsWorkspaceStateHydrated(false)
      }

      showToastMessage('Workspace deleted')
    } catch (error) {
      showToastMessage(toErrorMessage(error))
      throw error
    }
  }

  function selectWorkspace(workspaceId: number) {
    if (workspaceId === activeWorkspaceId) {
      setIsWorkspacePanelOpen(false)
      return
    }

    flushPendingWorkspaceState()
    setActiveWorkspaceId(workspaceId)
    setIsWorkspaceStateHydrated(false)
    setIsWorkspacePanelOpen(false)
  }

  useEffect(() => {
    return () => {
      flushPendingWorkspaceState()

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }

      if (statePersistTimerRef.current) {
        window.clearTimeout(statePersistTimerRef.current)
      }
    }
  }, [flushPendingWorkspaceState])

  return (
    <div className="studio-root">
      <div className="app-shell">
        <StudioRail
          page={page}
          onChangePage={onChangePage}
          isWorkspacePanelOpen={isWorkspacePanelOpen}
          onToggleWorkspacePanel={() => setIsWorkspacePanelOpen((prev) => !prev)}
        />

        <WorkspacePanel
          isOpen={isWorkspacePanelOpen}
          activeWorkspaceId={activeWorkspaceId}
          workspaces={workspaces}
          isLoading={workspacesQuery.isLoading}
          isCreating={createWorkspaceMutation.isPending}
          isDeletingWorkspaceId={deleteWorkspaceMutation.isPending ? deleteWorkspaceMutation.variables ?? null : null}
          onSelectWorkspace={selectWorkspace}
          onCreateWorkspace={createWorkspaceAndSelect}
          onDeleteWorkspace={deleteWorkspaceById}
        />

        {!activeWorkspace ? (
          <section className="page active">
            <div className="empty-state">
              <h3>Pick a workspace</h3>
              <p>Create or select a workspace to load context and design pipeline state.</p>
            </div>
          </section>
        ) : !isWorkspaceReady ? (
          <section className="page active">
            <div className="empty-state">
              <h3>Loading workspace</h3>
              <p>Restoring context and design pipeline state...</p>
            </div>
          </section>
        ) : page === 'search' ? (
          <SearchPage
            assets={assets}
            pendingAddIds={pendingAddIds}
            pendingRemoveIds={pendingRemoveIds}
            contextAssetIds={contextAssetIds}
            selectedCount={assets.filter((asset) => (contextAssetIds.has(asset.id) ? !pendingRemoveIds.has(asset.id) : pendingAddIds.has(asset.id))).length}
            searchInput={searchInput}
            isSearching={searchMutation.isPending}
            onSearchInputChange={onSearchInputChange}
            onSearchClick={onSearchClick}
            onToggleAsset={toggleAsset}
            onOpenPreview={setPreviewAsset}
            onSaveToContext={saveToContext}
          />
        ) : (
          <DesignPage
            key={activeWorkspace.id}
            contextAssets={contextAssets}
            onRemoveContext={removeFromContext}
            onBackToSearch={() => onChangePage('search')}
            savedState={designPipelineState}
            onStateChange={onDesignPipelineStateChange}
          />
        )}
      </div>

      <ImagePreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />
      <Toast message={toastMessage} visible={showToast} />
    </div>
  )
}
