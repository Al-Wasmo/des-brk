import type { AssetItem } from '../types'
import { CheckIcon, ImageIcon, SaveIcon, SearchIcon } from './icons'

type SearchPageProps = {
  assets: AssetItem[]
  pendingAddIds: Set<number>
  pendingRemoveIds: Set<number>
  contextAssetIds: Set<number>
  selectedCount: number
  searchInput: string
  isSearching: boolean
  onSearchInputChange: (value: string) => void
  onSearchClick: () => void
  onToggleAsset: (id: number, isInContext: boolean) => void
  onOpenPreview: (asset: AssetItem) => void
  onSaveToContext: () => void
}

export function SearchPage({
  assets,
  pendingAddIds,
  pendingRemoveIds,
  contextAssetIds,
  selectedCount,
  searchInput,
  isSearching,
  onSearchInputChange,
  onSearchClick,
  onToggleAsset,
  onOpenPreview,
  onSaveToContext,
}: SearchPageProps) {
  const loadingCards = Array.from({ length: 10 })

  return (
    <section className="page active">
      <div className="topbar">
        <div className="topbar-title">
          <h1>Design Search</h1>
          <p>Search, select and send designs to AI</p>
        </div>
        <div className="topbar-spacer" />
  
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <SearchIcon />
          <input
            className="search-input wide"
            type="text"
            placeholder="Search designs..."
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
          />
        </div>

        <button type="button" className="btn btn-primary" onClick={onSearchClick} disabled={isSearching}>
          <SearchIcon />
          {isSearching ? 'Searching...' : 'Search'}
        </button>

        <div className="toolbar-spacer" />

        <span className="toolbar-count">
          {assets.length} result{assets.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="action-bar">
        <span className="selection-info">
          {selectedCount > 0 ? (
            <>
              <strong>{selectedCount}</strong> item{selectedCount > 1 ? 's' : ''} selected
            </>
          ) : (
            'No items selected'
          )}
        </span>
        <div className="toolbar-spacer" />
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSaveToContext}
        >
          <SaveIcon />
          Save context
        </button>
      </div>

      <div className="content-area">
        {isSearching ? (
          <div className="asset-grid">
            {loadingCards.map((_, index) => (
              <div key={index} className="asset-card-wrap">
                <div className="asset-card loading">
                  <div className="asset-thumb-skeleton shimmer" />
                  <div className="asset-info">
                    <div className="line-skeleton shimmer short" />
                    <div className="line-skeleton shimmer tiny" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="asset-grid">
            {assets.map((asset) => {
              const isInContext = contextAssetIds.has(asset.id)
              const isSelected = isInContext ? !pendingRemoveIds.has(asset.id) : pendingAddIds.has(asset.id)
              const toggleAssetSelection = () => onToggleAsset(asset.id, isInContext)
              return (
                <div key={asset.id} className="asset-card-wrap">
                  <div className={`asset-card ${isSelected ? 'selected' : ''} ${isInContext ? 'context-selected' : ''}`}>
                    <button
                      type="button"
                      className="asset-preview-btn"
                      onClick={() => onOpenPreview(asset)}
                      aria-label={`Preview ${asset.fileName}`}
                    >
                      {asset.previewUrl ? (
                        <img className="asset-thumb" src={asset.previewUrl} alt={asset.fileName} loading="lazy" />
                      ) : (
                        <div className={`asset-thumb-placeholder ${asset.tone}`}>
                          <ImageIcon />
                        </div>
                      )}
                    </button>
                    <div
                      className="asset-info"
                      role="button"
                      tabIndex={0}
                      onClick={toggleAssetSelection}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          toggleAssetSelection()
                        }
                      }}
                      aria-label={isSelected ? `Unselect ${asset.fileName}` : `Select ${asset.fileName}`}
                    >
                      <button
                        type="button"
                        className={`asset-select-btn ${isSelected ? 'selected' : ''}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleAssetSelection()
                        }}
                        aria-label={
                          isSelected ? `Unselect ${asset.fileName}` : `Select ${asset.fileName}`
                        }
                      >
                        <CheckIcon />
                      </button>
                      <div className="asset-info-copy">
                        <div className="asset-name">{asset.fileName}</div>
                        <div className="asset-meta">{asset.meta}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
