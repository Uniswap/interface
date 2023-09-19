import React, { useState } from 'react'
import { BottomSheetDetachedModal } from 'src/components/modals/BottomSheetModal'
import { ModalName } from 'src/features/telemetry/constants'
import { Text, TouchableArea, TouchableAreaProps, useSporeColors } from 'ui/src'
import InfoCircle from 'ui/src/assets/icons/info-circle.svg'

const DEFAULT_ICON_SIZE = 20

type InfoButtonProps = {
  content: string
  size?: number
} & TouchableAreaProps

export function TooltipInfoButton({ size, content, ...rest }: InfoButtonProps): JSX.Element {
  const colors = useSporeColors()
  const [showModal, setShowModal] = useState(false)
  return (
    <>
      <TouchableArea onPress={(): void => setShowModal(true)} {...rest}>
        <InfoCircle
          color={colors.neutral2.val}
          height={size ?? DEFAULT_ICON_SIZE}
          width={size ?? DEFAULT_ICON_SIZE}
        />
      </TouchableArea>
      {showModal && (
        <BottomSheetDetachedModal
          backgroundColor={colors.surface2.val}
          name={ModalName.TooltipContent}
          onClose={(): void => setShowModal(false)}>
          <Text p="$spacing16" variant="bodyLarge">
            {content}
          </Text>
        </BottomSheetDetachedModal>
      )}
    </>
  )
}
