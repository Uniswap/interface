import { BottomSheetModal as BaseModal, BottomSheetProps } from '@gorhom/bottom-sheet'
import React, { useEffect, useRef } from 'react'
import { bottomSheetStyles } from 'src/styles/bottomSheet'

export interface BottomSheetModalProps extends BottomSheetProps {
  isVisible: boolean
  onClose: () => void
}

const CLOSED_INDEX = -1

export function BottomSheetModal({
  isVisible,
  snapPoints,
  children,
  onClose,
}: BottomSheetModalProps) {
  const modalRef = useRef<BaseModal>(null)

  useEffect(() => {
    if (isVisible) {
      modalRef.current?.present()
    } else {
      modalRef.current?.close()
    }
  }, [isVisible])

  const onChange = (index: number) => {
    if (index === CLOSED_INDEX) {
      onClose()
    }
  }

  return (
    <BaseModal
      onChange={onChange}
      ref={modalRef}
      style={bottomSheetStyles.bottomSheet}
      snapPoints={snapPoints}>
      {children}
    </BaseModal>
  )
}
