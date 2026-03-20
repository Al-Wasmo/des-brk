import type { KeyboardEvent } from 'react'

import type { ChatMessage, AssetItem } from '../types'
import { BrandIcon, ChatIcon, CloseIcon, ImageIcon, SearchIcon, SendIcon } from './icons'

type ChatPageProps = {
  contextAssets: AssetItem[]
  messages: ChatMessage[]
  input: string
  isTyping: boolean
  onInputChange: (value: string) => void
  onInputKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onRemoveContext: (id: number) => void
  onBackToSearch: () => void
}

export function ChatPage({
  contextAssets,
  messages,
  input,
  isTyping,
  onInputChange,
  onInputKeyDown,
  onSend,
  onRemoveContext,
  onBackToSearch,
}: ChatPageProps) {
  const hasMessages = messages.length > 0

  return (
    <section className="page active">
      <div className="topbar">
        <div className="topbar-title">
          <h1>AI Prompt Generator</h1>
          <p>Chat with AI using your selected designs as context</p>
        </div>
        <div className="topbar-spacer" />
        <button type="button" className="btn btn-secondary" onClick={onBackToSearch}>
          <SearchIcon />
          Add Designs
        </button>
      </div>

      <div className="chat-context-bar">
        <span className="context-label">Context</span>
        <div className={`context-gallery ${contextAssets.length === 0 ? 'empty' : ''}`}>
          {contextAssets.length === 0 ? (
            <span className="context-empty">No designs in context - go to Search and save some</span>
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
                    aria-label={`Remove ${asset.fileName} from context`}
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

      {contextAssets.length > 0 ? (
        <div className="chat-context-actions">
          <span>{contextAssets.length} selected image{contextAssets.length > 1 ? 's' : ''} in context</span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              contextAssets.forEach((asset) => onRemoveContext(asset.id))
            }}
          >
            Clear All
          </button>
        </div>
      ) : null}

      <div className="chat-messages">
        {!hasMessages ? (
          <div className="empty-state">
            <div className="empty-icon">
              <ChatIcon />
            </div>
            <h3>Start a conversation</h3>
            <p>Select designs in Search, save them to context, then ask AI to generate prompts.</p>
          </div>
        ) : null}

        {messages.map((message) => (
          <div key={message.id} className={`msg ${message.role}`}>
            <div className="msg-avatar">{message.role === 'user' ? 'A' : <BrandIcon />}</div>
            <div>
              <div className="msg-bubble">{message.text}</div>
              <div className="msg-time">{message.timeLabel}</div>
            </div>
          </div>
        ))}

        {isTyping ? (
          <div className="msg assistant">
            <div className="msg-avatar">
              <BrandIcon />
            </div>
            <div>
              <div className="msg-bubble">
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="chat-input-area">
        <div className="chat-input-row">
          <textarea
            className="chat-textarea"
            placeholder="Ask the AI to generate prompts based on your designs..."
            value={input}
            rows={1}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onInputKeyDown}
          />
          <button type="button" className="send-btn" onClick={onSend} disabled={!input.trim() || isTyping}>
            <SendIcon />
          </button>
        </div>
        <div className="chat-hint">
          Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for new line
        </div>
      </div>
    </section>
  )
}
