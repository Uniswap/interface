import { useCallback, useEffect, useRef, useState } from 'react'
import { PaginatedModalRenderer, PaginatedModals } from 'uniswap/src/components/modals/PaginatedModals'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'

export type ConditionalModalRenderer = {
  renderModal: PaginatedModalRenderer
  condition: boolean
}

type SpeedBumpsProps = {
  modalRenderers: ConditionalModalRenderer[]
  checkSpeedBumps: boolean
  setCheckSpeedBumps: (value: boolean) => void
  onConfirm: () => void
}

export function SpeedBumps({
  modalRenderers,
  checkSpeedBumps,
  setCheckSpeedBumps,
  onConfirm: onConfirmFinish,
}: SpeedBumpsProps): JSX.Element {
  const onConfirmRef = useRef(onConfirmFinish)
  onConfirmRef.current = onConfirmFinish
  const [displayedModals, setDisplayedModals] = useState<PaginatedModalRenderer[] | undefined>()

  const handleClose = useCallback(() => {
    setCheckSpeedBumps(false)
  }, [setCheckSpeedBumps])

  const handleConfirm = useCallback(() => {
    onConfirmRef.current()
    handleClose()
  }, [handleClose])

  useEffect(() => {
    if (!checkSpeedBumps) {
      setDisplayedModals(undefined)
      return
    }

    const newModals = modalRenderers.filter(({ condition }) => condition).map(({ renderModal }) => renderModal)

    if (newModals.length > 0) {
      dismissNativeKeyboard()
      setDisplayedModals(newModals)
    } else {
      handleConfirm()
      setDisplayedModals(undefined)
    }
  }, [checkSpeedBumps, modalRenderers, handleConfirm])

  return <PaginatedModals modals={displayedModals ?? []} onClose={handleClose} onFinish={handleConfirm} />
}
