import { useEffect } from 'react'

import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

import type { AssetItem } from '../types'
import { CloseIcon } from './icons'

type ImagePreviewModalProps = {
  asset: AssetItem | null
  onClose: () => void
}

export function ImagePreviewModal({ asset, onClose }: ImagePreviewModalProps) {
  useEffect(() => {
    if (!asset) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [asset, onClose])

  if (!asset) {
    return null
  }
  const previewUrl = asset.previewUrl ?? undefined

  return (
    <div className="image-modal-backdrop" onClick={onClose}>
      <button type="button" className="image-modal-close" onClick={onClose} aria-label="Close preview">
        <CloseIcon />
      </button>
      <div className="image-modal" onClick={(event) => event.stopPropagation()}>
        {previewUrl ? (
          <TransformWrapper initialScale={1} minScale={1} maxScale={6} wheel={{ step: 0.2 }} doubleClick={{ mode: 'zoomIn', step: 1.2 }}>
            <TransformComponent wrapperClass="zoom-wrapper" contentClass="zoom-content">
              <img className="zoomed-image" src={previewUrl} alt={asset.fileName} />
            </TransformComponent>
          </TransformWrapper>
        ) : (
          <div className="image-modal-empty">No preview available for this item.</div>
        )}
      </div>
    </div>
  )
}
