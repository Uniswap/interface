import { memo, useCallback, useRef, useState } from 'react'

export type PaginatedModalProps = {
  onAcknowledge: () => void
  onClose: () => void
  key: number
}

export type PaginatedModalRenderer = (props: PaginatedModalProps) => JSX.Element | null

type PaginatedModalsProps = {
  modals: PaginatedModalRenderer[]
  onClose: () => void
  onFinish: () => void
}

export function PaginatedModals({ modals, onClose, onFinish }: PaginatedModalsProps): JSX.Element | null {
  const previousPagesRef = useRef<Set<number>>(new Set())
  const [shownModalIndex, setShownModalIndex] = useState(0)

  const cleanup = useCallback(() => {
    previousPagesRef.current.clear()
    setShownModalIndex(0)
  }, [])

  const handleClose = useCallback(
    (modalIndex: number) => {
      // We want to call onClose only if the modal was closed without confirming.
      // (onConfirm will be called first when the user confirms)
      if (!previousPagesRef.current.has(modalIndex)) {
        cleanup()
        onClose()
      }
    },
    [onClose, cleanup],
  )

  const handleConfirm = useCallback(() => {
    setShownModalIndex((currentIndex) => {
      previousPagesRef.current.add(currentIndex)
      if (currentIndex + 1 >= modals.length) {
        cleanup()
        onFinish()
        return currentIndex
      }
      return currentIndex + 1
    })
  }, [modals.length, onFinish, cleanup])

  const renderModal = modals[shownModalIndex]

  return renderModal ? (
    <Page modalIndex={shownModalIndex} renderModal={renderModal} onClose={handleClose} onConfirm={handleConfirm} />
  ) : null
}

type PageProps = {
  modalIndex: number
  renderModal: PaginatedModalRenderer
  onClose: (modalIndex: number) => void
  onConfirm: () => void
}

const Page = memo(function _Page({ modalIndex, renderModal, onClose, onConfirm }: PageProps): JSX.Element | null {
  return renderModal({ onClose: () => onClose(modalIndex), onAcknowledge: onConfirm, key: modalIndex })
})
