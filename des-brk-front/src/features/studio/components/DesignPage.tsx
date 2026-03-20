import { useEffect, useMemo, useRef, useState } from 'react'

import { socketUrl } from '../../../api/client'
import { getGenerateDesignJobStatus, useRunGenerateDesignMutation } from '../../../api/generateDesign/queries'
import type { GenerateDesignSocketMessage } from '../../../api/generateDesign/types'
import {
  useDeletePromptPresetMutation,
  usePromptPresetsQuery,
  useSavePromptPresetMutation,
} from '../../../api/prompts/queries'
import type { PromptPreset } from '../../../api/prompts/types'
import { getReverseDesignJobStatus, useRunReverseDesignMutation } from '../../../api/reverseDesign/queries'
import type { ReverseDesignSocketMessage } from '../../../api/reverseDesign/types'
import type { AssetItem } from '../types'
import { CheckIcon, CloseIcon, ImageIcon, SearchIcon } from './icons'

type DesignPageProps = {
  contextAssets: AssetItem[]
  onRemoveContext: (id: number) => void
  onBackToSearch: () => void
  savedState: Partial<DesignPipelineState> | null
  onStateChange: (state: DesignPipelineState) => void
}

type UiStage = 'prompt' | 'doc'
export type DesignPipelineState = {
  uiStage: UiStage
  activeStep: 1 | 2 | 3
  autoMode: boolean
  initialPrompt: string
  promptTitle: string
  selectedPromptId: string
  markdownDoc: string
  docError: string
  mockupFolder: string
  mockupHtml: string
  mockupError: string
  isGeneratingDoc: boolean
  isGeneratingMockup: boolean
  reverseJobId: string
  generateJobId: string
}

function buildInitialPrompt(contextAssets: AssetItem[]) {
  const names = contextAssets.map((asset) => asset.name)
  const contextLine = names.length > 0 ? 'Context images: ' + names.join(', ') : 'Context images: none selected yet'

  return [
    'Goal: Build a production-grade UI concept that is easy to implement and iterate.',
    contextLine,
    '',
    'Generate a reverse design document with:',
    '- visual direction',
    '- layout hierarchy',
    '- typography and spacing principles',
    '- component behavior notes',
    '- accessibility notes',
  ].join('\n')
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  return 'Request failed'
}

function isMissingGenerateJobError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }
  const message = error.message.toLowerCase()
  return message.includes('generate-design job not found') || message.includes('request failed: 404')
}

function inferPromptTitle(prompt: string) {
  const firstLine = prompt
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)

  if (!firstLine) {
    return 'Saved prompt'
  }

  return firstLine.slice(0, 80)
}

function hydratePipelineState(
  savedState: Partial<DesignPipelineState> | null,
  contextAssets: AssetItem[],
): DesignPipelineState {
  const defaults: DesignPipelineState = {
    uiStage: 'prompt',
    activeStep: 1,
    autoMode: false,
    initialPrompt: buildInitialPrompt(contextAssets),
    promptTitle: '',
    selectedPromptId: '',
    markdownDoc: '',
    docError: '',
    mockupFolder: '',
    mockupHtml: '',
    mockupError: '',
    isGeneratingDoc: false,
    isGeneratingMockup: false,
    reverseJobId: '',
    generateJobId: '',
  }

  if (!savedState) {
    return defaults
  }

  return {
    uiStage: savedState.uiStage === 'doc' ? 'doc' : 'prompt',
    activeStep: savedState.activeStep === 2 || savedState.activeStep === 3 ? savedState.activeStep : 1,
    autoMode: savedState.autoMode === true,
    initialPrompt: typeof savedState.initialPrompt === 'string' ? savedState.initialPrompt : defaults.initialPrompt,
    promptTitle: typeof savedState.promptTitle === 'string' ? savedState.promptTitle : '',
    selectedPromptId: typeof savedState.selectedPromptId === 'string' ? savedState.selectedPromptId : '',
    markdownDoc: typeof savedState.markdownDoc === 'string' ? savedState.markdownDoc : '',
    docError: typeof savedState.docError === 'string' ? savedState.docError : '',
    mockupFolder: typeof savedState.mockupFolder === 'string' ? savedState.mockupFolder : '',
    mockupHtml: typeof savedState.mockupHtml === 'string' ? savedState.mockupHtml : '',
    mockupError: typeof savedState.mockupError === 'string' ? savedState.mockupError : '',
    isGeneratingDoc: savedState.isGeneratingDoc === true,
    isGeneratingMockup: savedState.isGeneratingMockup === true,
    reverseJobId: typeof savedState.reverseJobId === 'string' ? savedState.reverseJobId : '',
    generateJobId: typeof savedState.generateJobId === 'string' ? savedState.generateJobId : '',
  }
}

export function DesignPage({ contextAssets, onRemoveContext, onBackToSearch, savedState, onStateChange }: DesignPageProps) {
  const hydratedState = useMemo(() => hydratePipelineState(savedState, contextAssets), [savedState, contextAssets])

  const [uiStage, setUiStage] = useState<UiStage>(hydratedState.uiStage)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(hydratedState.activeStep)
  const [autoMode, setAutoMode] = useState(hydratedState.autoMode)
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(hydratedState.isGeneratingDoc)
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(hydratedState.isGeneratingMockup)
  const [initialPrompt, setInitialPrompt] = useState(hydratedState.initialPrompt)
  const [promptTitle, setPromptTitle] = useState(hydratedState.promptTitle)
  const [markdownDoc, setMarkdownDoc] = useState(hydratedState.markdownDoc)
  const [docError, setDocError] = useState(hydratedState.docError)
  const [docSocketStatus, setDocSocketStatus] = useState('')
  const [mockupFolder, setMockupFolder] = useState(hydratedState.mockupFolder)
  const [mockupHtml, setMockupHtml] = useState(hydratedState.mockupHtml)
  const [jobId, setJobId] = useState(hydratedState.reverseJobId)
  const [generateJobId, setGenerateJobId] = useState(hydratedState.generateJobId)
  const [mockupError, setMockupError] = useState(hydratedState.mockupError)
  const [mockupSocketStatus, setMockupSocketStatus] = useState('')
  const [selectedPromptId, setSelectedPromptId] = useState(hydratedState.selectedPromptId)
  const [promptMessage, setPromptMessage] = useState('')
  const [hasAutoLoadedLatestPrompt, setHasAutoLoadedLatestPrompt] = useState(Boolean(savedState))

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | undefined>(undefined)
  const reconnectAttemptsRef = useRef(0)
  const suppressReconnectRef = useRef(false)
  const canReconnectGenerateRef = useRef(true)
  const isGeneratingDocRef = useRef(isGeneratingDoc)
  const isGeneratingMockupRef = useRef(isGeneratingMockup)
  const reverseJobIdRef = useRef(jobId)
  const generateJobIdRef = useRef(generateJobId)
  const lastSharedStateRef = useRef('')

  const promptPresetsQuery = usePromptPresetsQuery()
  const savePromptPresetMutation = useSavePromptPresetMutation()
  const deletePromptPresetMutation = useDeletePromptPresetMutation()
  const runReverseDesignMutation = useRunReverseDesignMutation()
  const runGenerateDesignMutation = useRunGenerateDesignMutation()

  const hasDoc = markdownDoc.trim().length > 0
  const hasPreview = mockupHtml.trim().length > 0
  const promptPresets = promptPresetsQuery.data ?? []
  const selectedPrompt = promptPresets.find((entry) => entry.id === Number(selectedPromptId))
  const isPromptDirty = selectedPrompt
    ? initialPrompt.trim() !== selectedPrompt.prompt.trim() || promptTitle.trim() !== selectedPrompt.title.trim()
    : initialPrompt.trim().length > 0
  const canSavePrompt = isPromptDirty && initialPrompt.trim().length > 0 && !savePromptPresetMutation.isPending

  function openFullPreviewTab() {
    if (!mockupHtml.trim()) {
      return
    }

    const blob = new Blob([mockupHtml], { type: 'text/html;charset=utf-8' })
    const blobUrl = URL.createObjectURL(blob)
    const opened = window.open(blobUrl, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
    if (!opened) {
      return
    }
  }

  function resetPromptFromContext() {
    setInitialPrompt(buildInitialPrompt(contextAssets))
    setPromptTitle('')
    setSelectedPromptId('')
  }

  function closeActiveSocket() {
    suppressReconnectRef.current = true
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = undefined
    }
    reconnectAttemptsRef.current = 0
  }

  function scheduleReconnect(kind: 'reverse' | 'generate', failedJobId: string) {
    if (kind === 'generate' && !canReconnectGenerateRef.current) {
      return
    }
    if (reconnectTimerRef.current) {
      return
    }

    reconnectAttemptsRef.current += 1
    const delay = Math.min(5000, 500 * 2 ** (reconnectAttemptsRef.current - 1))

    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = undefined
      if (kind === 'reverse') {
        if (!isGeneratingDocRef.current || reverseJobIdRef.current !== failedJobId) {
          return
        }
        connectReverseSocket(failedJobId)
        return
      }

      if (!isGeneratingMockupRef.current || generateJobIdRef.current !== failedJobId) {
        return
      }
      connectGenerateSocket(failedJobId)
    }, delay)
  }

  function connectReverseSocket(nextJobId: string) {
    suppressReconnectRef.current = true
    closeActiveSocket()
    if (!nextJobId) {
      return
    }

    setDocError('')
    suppressReconnectRef.current = false
    const ws = new WebSocket(socketUrl('/api/v1/reverse-design/ws/' + nextJobId))
    wsRef.current = ws

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0
      setDocSocketStatus('')
    }

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ReverseDesignSocketMessage
        handleReverseSocketMessage(payload)
      } catch {
        setDocError('Failed to parse backend socket message')
        scheduleReconnect('reverse', nextJobId)
      }
    }

    ws.onerror = () => {
      setDocSocketStatus('Socket disconnected. Reconnecting to reverse-design job...')
      scheduleReconnect('reverse', nextJobId)
    }

    ws.onclose = () => {
      wsRef.current = null
      if (!suppressReconnectRef.current) {
        scheduleReconnect('reverse', nextJobId)
      }
    }
  }

  function connectGenerateSocket(nextJobId: string) {
    suppressReconnectRef.current = true
    closeActiveSocket()
    if (!nextJobId) {
      return
    }

    setMockupError('')
    suppressReconnectRef.current = false
    const ws = new WebSocket(socketUrl('/api/v1/generate-design/ws/' + nextJobId))
    wsRef.current = ws

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0
      setMockupSocketStatus('')
    }

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as GenerateDesignSocketMessage
        handleGenerateSocketMessage(payload)
      } catch {
        setMockupError('Failed to parse generate-design socket message')
        scheduleReconnect('generate', nextJobId)
      }
    }

    ws.onerror = () => {
      setMockupSocketStatus('Socket disconnected. Reconnecting to generate-design job...')
      scheduleReconnect('generate', nextJobId)
    }

    ws.onclose = () => {
      wsRef.current = null
      if (!suppressReconnectRef.current) {
        scheduleReconnect('generate', nextJobId)
      }
    }
  }

  async function onSaveCurrentPrompt() {
    const nextPrompt = initialPrompt.trim()
    if (!nextPrompt) {
      setPromptMessage('Write a prompt before saving')
      return
    }

    try {
      const nextTitle = promptTitle.trim()
      const saved = await savePromptPresetMutation.mutateAsync({
        prompt: nextPrompt,
        title: nextTitle || inferPromptTitle(nextPrompt),
      })
      setSelectedPromptId(String(saved.id))
      setPromptTitle(saved.title)
      setHasAutoLoadedLatestPrompt(true)
      setPromptMessage('Prompt saved')
    } catch (error) {
      setPromptMessage(toErrorMessage(error))
    }
  }

  async function onDeleteSelectedPrompt() {
    if (!selectedPromptId) {
      setPromptMessage('Select a saved prompt first')
      return
    }

    try {
      await deletePromptPresetMutation.mutateAsync(Number(selectedPromptId))
      setSelectedPromptId('')
      setPromptTitle('')
      setPromptMessage('Prompt deleted')
    } catch (error) {
      setPromptMessage(toErrorMessage(error))
    }
  }

  function onPromptPresetSelect(nextId: string) {
    setSelectedPromptId(nextId)
    setHasAutoLoadedLatestPrompt(true)
    if (!nextId) {
      return
    }

    const selected = promptPresets.find((entry) => entry.id === Number(nextId))
    if (!selected) {
      setPromptMessage('Selected prompt no longer exists')
      return
    }

    setInitialPrompt(selected.prompt)
    setPromptTitle(selected.title)
    setPromptMessage('Prompt loaded')
  }

  useEffect(() => {
    const snapshot: DesignPipelineState = {
      uiStage,
      activeStep,
      autoMode,
      initialPrompt,
      promptTitle,
      selectedPromptId,
      markdownDoc,
      docError,
      mockupFolder,
      mockupHtml,
      mockupError,
      isGeneratingDoc,
      isGeneratingMockup,
      reverseJobId: jobId,
      generateJobId,
    }

    const signature = JSON.stringify(snapshot)
    if (signature === lastSharedStateRef.current) {
      return
    }
    lastSharedStateRef.current = signature
    onStateChange(snapshot)
  }, [uiStage, activeStep, autoMode, initialPrompt, promptTitle, selectedPromptId, markdownDoc, docError, mockupFolder, mockupHtml, mockupError, isGeneratingDoc, isGeneratingMockup, jobId, generateJobId, onStateChange])

  useEffect(() => {
    isGeneratingDocRef.current = isGeneratingDoc
    isGeneratingMockupRef.current = isGeneratingMockup
    reverseJobIdRef.current = jobId
    generateJobIdRef.current = generateJobId
  }, [isGeneratingDoc, isGeneratingMockup, jobId, generateJobId])

  useEffect(() => {
    if (hasAutoLoadedLatestPrompt) {
      return
    }
    if (promptPresets.length === 0) {
      return
    }

    const latest = promptPresets[0]
    setSelectedPromptId(String(latest.id))
    setPromptTitle(latest.title)
    setInitialPrompt(latest.prompt)
    setPromptMessage('Loaded latest saved prompt')
    setHasAutoLoadedLatestPrompt(true)
  }, [promptPresets, hasAutoLoadedLatestPrompt])

  useEffect(() => {
    if (!selectedPromptId || !promptPresetsQuery.isSuccess) {
      return
    }

    const exists = promptPresets.some((entry) => entry.id === Number(selectedPromptId))
    if (!exists) {
      setSelectedPromptId('')
      setPromptTitle('')
    }
  }, [selectedPromptId, promptPresets, promptPresetsQuery.isSuccess])

  function handleReverseSocketMessage(message: ReverseDesignSocketMessage) {
    if (message.type === 'job.completed') {
      const nextDoc = message.result?.output_text?.trim() ?? ''
      setMarkdownDoc(nextDoc)
      setDocError(nextDoc ? '' : 'Job completed but no design document was returned')
      setIsGeneratingDoc(false)
      setDocSocketStatus('')
      setJobId(message.job_id)
      if (!message.auto_mode) {
        closeActiveSocket()
      }
      return
    }

    if (message.type === 'job.auto_generate_started') {
      const nextDoc = message.result?.output_text?.trim() ?? ''
      if (nextDoc) {
        setMarkdownDoc(nextDoc)
        setDocError('')
      }
      setIsGeneratingDoc(false)
      setActiveStep(3)
      setIsGeneratingMockup(true)
      setDocSocketStatus('')
      setJobId(message.job_id)
      setGenerateJobId(message.generate_job_id ?? '')
      setMockupError('')
      return
    }

    if (message.type === 'job.auto_generate_completed') {
      const nextDoc = message.result?.output_text?.trim() ?? ''
      if (nextDoc) {
        setMarkdownDoc(nextDoc)
        setDocError('')
      }
      const nextHtml = message.generate_result?.output_text ?? ''
      setMockupHtml(nextHtml)
      setMockupFolder(message.generate_result?.output_file ?? message.generate_result?.stage_dir ?? '')
      setMockupError(nextHtml ? '' : 'Auto mode completed but no index.html content was returned')
      setIsGeneratingDoc(false)
      setIsGeneratingMockup(false)
      setDocSocketStatus('')
      setMockupSocketStatus('')
      canReconnectGenerateRef.current = false
      setActiveStep(3)
      setJobId(message.job_id)
      closeActiveSocket()
      return
    }

    if (message.type === 'job.auto_generate_failed') {
      const nextDoc = message.result?.output_text?.trim() ?? ''
      if (nextDoc) {
        setMarkdownDoc(nextDoc)
      }
      setIsGeneratingDoc(false)
      setIsGeneratingMockup(false)
      setDocSocketStatus('')
      setMockupSocketStatus('')
      canReconnectGenerateRef.current = false
      setActiveStep(3)
      setJobId(message.job_id)
      setMockupError(message.error ?? 'Auto mode failed while generating design')
      closeActiveSocket()
      return
    }

    if (message.type === 'job.failed') {
      const nextDoc = message.result?.output_text?.trim() ?? ''
      setMarkdownDoc(nextDoc)
      setDocError(message.error ?? message.result?.stderr ?? 'Reverse design generation failed')
      setIsGeneratingDoc(false)
      setDocSocketStatus('')
      setJobId(message.job_id)
      closeActiveSocket()
      return
    }

    if (message.type === 'job.not_found') {
      setDocError('Job was not found on backend')
      setIsGeneratingDoc(false)
      setDocSocketStatus('')
      setJobId(message.job_id)
      closeActiveSocket()
    }
  }

  function handleGenerateSocketMessage(message: GenerateDesignSocketMessage) {
    if (message.type === 'job.completed') {
      const nextHtml = message.result?.output_text ?? ''
      setMockupHtml(nextHtml)
      setMockupFolder(message.result?.output_file ?? message.result?.stage_dir ?? '')
      setMockupError(nextHtml ? '' : 'Job completed but no index.html content was returned')
      setIsGeneratingMockup(false)
      setMockupSocketStatus('')
      canReconnectGenerateRef.current = false
      setGenerateJobId(message.job_id)
      closeActiveSocket()
      return
    }

    if (message.type === 'job.failed') {
      const nextHtml = message.result?.output_text ?? ''
      setMockupHtml(nextHtml)
      setMockupFolder(message.result?.output_file ?? '')
      setMockupError(message.error ?? message.result?.stderr ?? 'Design generation failed')
      setIsGeneratingMockup(false)
      setMockupSocketStatus('')
      canReconnectGenerateRef.current = false
      setGenerateJobId(message.job_id)
      closeActiveSocket()
      return
    }

    if (message.type === 'job.not_found') {
      setIsGeneratingMockup(false)
      setMockupSocketStatus('')
      canReconnectGenerateRef.current = false
      setGenerateJobId('')
      setMockupError('')
      closeActiveSocket()
    }
  }

  async function onConfirmPrompt() {
    if (!initialPrompt.trim() || isGeneratingDoc) {
      return
    }

    if (contextAssets.length === 0) {
      setDocError('Add at least one design from Search before running reverse design')
      return
    }

    setUiStage('doc')
    setActiveStep(2)
    setIsGeneratingDoc(true)
    setDocError('')
    setDocSocketStatus('')
    setMarkdownDoc('')
    setMockupHtml('')
    setMockupFolder('')
    setMockupError('')
    setJobId('')
    setGenerateJobId('')

    closeActiveSocket()

    try {
      const response = await runReverseDesignMutation.mutateAsync({
        image_asset_ids: contextAssets.map((asset) => asset.id),
        prompt: initialPrompt.trim(),
        auto_mode: autoMode,
      })

      setJobId(response.job_id)
      connectReverseSocket(response.job_id)
    } catch (error) {
      setDocError(toErrorMessage(error))
      setIsGeneratingDoc(false)
    }
  }

  function onGenerateHtmlDirectory() {
    if (!markdownDoc.trim() || isGeneratingMockup || runGenerateDesignMutation.isPending) {
      return
    }

    void (async () => {
      setActiveStep(3)
      setIsGeneratingMockup(true)
      setMockupHtml('')
      setMockupFolder('')
      setMockupError('')
      setMockupSocketStatus('')
      canReconnectGenerateRef.current = true
      setGenerateJobId('')
      closeActiveSocket()

      try {
        const response = await runGenerateDesignMutation.mutateAsync({
          image_asset_ids: contextAssets.map((asset) => asset.id),
          design_doc: markdownDoc.trim(),
        })

        setGenerateJobId(response.job_id)
        connectGenerateSocket(response.job_id)
      } catch (error) {
        setMockupError(toErrorMessage(error))
        setIsGeneratingMockup(false)
      }
    })()
  }

  useEffect(() => {
    let cancelled = false

    async function resumeFromBackend() {
      if (wsRef.current) {
        return
      }

      if (isGeneratingDoc && jobId) {
        try {
          const status = await getReverseDesignJobStatus(jobId)
          if (cancelled) {
            return
          }

          if (status.type === 'job.accepted' || status.type === 'job.auto_generate_started') {
            setDocSocketStatus('Waiting on socket for job ' + jobId + '...')
            connectReverseSocket(jobId)
            return
          }

          handleReverseSocketMessage(status)
          return
        } catch {
          connectReverseSocket(jobId)
          return
        }
      }

      if ((isGeneratingMockup || (activeStep === 3 && generateJobId && !hasPreview)) && generateJobId) {
        canReconnectGenerateRef.current = true
        if (!isGeneratingMockup) {
          setIsGeneratingMockup(true)
        }

        try {
          const status = await getGenerateDesignJobStatus(generateJobId)
          if (cancelled) {
            return
          }

          if (status.type === 'job.accepted') {
            setMockupSocketStatus('Waiting on socket for generation job ' + generateJobId + '...')
            connectGenerateSocket(generateJobId)
            return
          }

          handleGenerateSocketMessage(status)
          return
        } catch (error) {
          if (isMissingGenerateJobError(error)) {
            setIsGeneratingMockup(false)
            setMockupSocketStatus('')
            canReconnectGenerateRef.current = false
            setGenerateJobId('')
            setMockupError('')
            return
          }
          setMockupSocketStatus('Reconnecting to generate-design job...')
          connectGenerateSocket(generateJobId)
        }
      }
    }

    void resumeFromBackend()
    return () => {
      cancelled = true
    }
  }, [activeStep, isGeneratingDoc, isGeneratingMockup, jobId, generateJobId, hasPreview])

  useEffect(() => {
    return () => {
      closeActiveSocket()
    }
  }, [])

  const step1Class = activeStep === 1 ? 'design-step active' : 'design-step done'
  const visibleDocError = isGeneratingDoc ? '' : docError
  const visibleMockupError = isGeneratingMockup ? '' : mockupError
  const step2Class =
    activeStep === 2
      ? 'design-step active'
      : hasDoc || isGeneratingDoc || hasPreview || isGeneratingMockup
        ? 'design-step done'
        : 'design-step pending'
  const step3Class = activeStep === 3 ? 'design-step active' : hasPreview ? 'design-step done' : 'design-step pending'

  return (
    <section className="page active">
      <div className="topbar">
        <div className="topbar-title">
          <h1>Design Pipeline</h1>
          <p>Prompt, wait for AI reverse-design doc, edit, then generate preview frame</p>
        </div>
        <div className="topbar-spacer" />
        <button type="button" className="btn btn-secondary" onClick={onBackToSearch}>
          <SearchIcon />
          Add Designs
        </button>
      </div>

      <div className="chat-context-bar">
        <span className="context-label">Context</span>
        <div className={contextAssets.length === 0 ? 'context-gallery empty' : 'context-gallery'}>
          {contextAssets.length === 0 ? (
            <span className="context-empty">No designs in context yet - add from Search</span>
          ) : (
            contextAssets.map((asset) => (
              <article key={asset.id} className="context-image-card">
                <div className="context-image-thumb-wrap">
                  {asset.previewUrl ? (
                    <img src={asset.previewUrl} alt={asset.fileName} className="context-image-thumb" loading="lazy" />
                  ) : (
                    <div className="context-chip-thumb">
                      <ImageIcon />
                    </div>
                  )}
                  <button
                    type="button"
                    className="context-image-remove"
                    onClick={() => onRemoveContext(asset.id)}
                    aria-label={'Remove ' + asset.fileName + ' from context'}
                  >
                    <CloseIcon />
                  </button>
                </div>
                <div className="context-image-name">{asset.fileName}</div>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="design-stepper">
        <button type="button" className={step1Class} onClick={() => setActiveStep(1)}>
          <div className="design-step-index">1</div>
          <div className="design-step-text">Prompt</div>
        </button>
        <button type="button" className={step2Class} onClick={() => setActiveStep(2)}>
          <div className="design-step-index">2</div>
          <div className="design-step-text">Reverse Doc</div>
        </button>
        <button type="button" className={step3Class} onClick={() => setActiveStep(3)}>
          <div className="design-step-index">3</div>
          <div className="design-step-text">Generated Frame</div>
        </button>
      </div>

      <div className="design-content">
        <div className="design-track" style={{ transform: `translateX(-${(activeStep - 1) * 100}%)` }}>
          <div className="design-slide">
            <div className="design-panel">
              <h3>Step 1: Initial Prompt</h3>
              <p>Write the exact prompt sent with your selected images.</p>
              <textarea
                className="chat-textarea design-textarea design-textarea-lg"
                value={initialPrompt}
                rows={10}
                onChange={(event) => setInitialPrompt(event.target.value)}
              />
              <div className="design-prompt-presets">
                <div className="design-prompt-presets-row">
                  <select
                    className="design-prompt-select"
                    value={selectedPromptId}
                    onChange={(event) => onPromptPresetSelect(event.target.value)}
                  >
                    <option value="">Saved prompts</option>
                    {promptPresets.map((entry: PromptPreset) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.title}
                      </option>
                    ))}
                  </select>
                  <input
                    className="design-prompt-title-input"
                    type="text"
                    placeholder="Prompt title (optional)"
                    value={promptTitle}
                    onChange={(event) => setPromptTitle(event.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={onDeleteSelectedPrompt}
                    disabled={!selectedPromptId || deletePromptPresetMutation.isPending}
                  >
                    Delete Saved
                  </button>
                  <button
                    type="button"
                    className={canSavePrompt ? 'btn btn-primary' : 'btn btn-secondary'}
                    onClick={onSaveCurrentPrompt}
                    disabled={!canSavePrompt}
                  >
                    Save Prompt
                  </button>
                </div>
                {promptMessage ? <p className="design-prompt-note">{promptMessage}</p> : null}
              </div>
              <label className="design-auto-toggle">
                <input type="checkbox" checked={autoMode} onChange={(event) => setAutoMode(event.target.checked)} />
                <span>Auto Mode: auto-confirm and auto-run HTML generation when agent sockets complete.</span>
              </label>
              <div className="design-actions">
                <button type="button" className="btn btn-secondary" onClick={resetPromptFromContext}>
                  Reset from Context
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onConfirmPrompt}
                  disabled={!initialPrompt.trim() || isGeneratingDoc || runReverseDesignMutation.isPending}
                >
                  Confirm Prompt
                </button>
              </div>
            </div>
          </div>

          <div className="design-slide">
            <div className="design-panel design-panel-gap">
              <h3>Step 2: AI Reverse Design Document</h3>
              <p>Review/edit the markdown, then move to Step 3 to generate final HTML.</p>

              {isGeneratingDoc ? (
                <div className="design-waiting">
                  <div className="design-loading-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  {docSocketStatus || (jobId ? 'Waiting on socket for job ' + jobId + '...' : 'Starting reverse design job...')}
                </div>
              ) : null}

              {visibleDocError ? <p className="design-error">{visibleDocError}</p> : null}

              <textarea
                className="chat-textarea design-textarea design-doc-textarea"
                value={markdownDoc}
                onChange={(event) => setMarkdownDoc(event.target.value)}
                rows={14}
                disabled={isGeneratingDoc}
                placeholder="Waiting for AI generated reverse design document..."
              />

              <div className="design-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setActiveStep(3)
                    onGenerateHtmlDirectory()
                  }}
                  disabled={!hasDoc || isGeneratingMockup || isGeneratingDoc}
                >
                  Next: Generate HTML Directory
                </button>
              </div>
            </div>
          </div>

          <div className="design-slide">
            <div className="design-panel design-panel-gap">
              <h3>Step 3: Generated Design Frame</h3>
              <p>Run generation, then open the full site in a separate tab.</p>

              <div className="design-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onGenerateHtmlDirectory}
                  disabled={!hasDoc || isGeneratingMockup || isGeneratingDoc}
                >
                  {hasPreview ? 'Regenerate HTML Directory' : 'Generate HTML Directory'}
                </button>
              </div>

              {isGeneratingMockup ? (
                <div className="design-waiting">
                  <div className="design-loading-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  {mockupSocketStatus || (generateJobId ? 'Waiting on socket for generation job ' + generateJobId + '...' : 'Starting HTML generation job...')}
                </div>
              ) : null}

              {visibleMockupError ? <p className="design-error">{visibleMockupError}</p> : null}

              {hasPreview ? (
                <div className="design-success-card">
                  <div className="design-success-icon" aria-hidden="true">
                    <CheckIcon />
                  </div>
                  <p className="design-success-title">Design generated</p>
                  <button type="button" className="btn btn-primary" onClick={openFullPreviewTab}>
                    Visit
                  </button>
                </div>
              ) : (
                <p>No generated index.html yet. You can jump here anytime and run generation.</p>
              )}
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}
