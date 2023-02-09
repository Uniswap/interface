import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React, { useState } from 'react'
import { useAppTheme } from 'src/app/hooks'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { BottomSheetDetachedModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ModalName } from 'src/features/telemetry/constants'
import { Theme } from 'src/styles/theme'

const DEFAULT_ICON_SIZE = 20

type InfoButtonProps = {
  content: string
  size?: number
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function TooltipInfoButton({ size, content, ...rest }: InfoButtonProps): JSX.Element {
  const theme = useAppTheme()
  const [showModal, setShowModal] = useState(false)
  return (
    <>
      <TouchableArea onPress={(): void => setShowModal(true)} {...rest}>
        <InfoCircle
          color={theme.colors.textSecondary}
          height={size ?? DEFAULT_ICON_SIZE}
          width={size ?? DEFAULT_ICON_SIZE}
        />
      </TouchableArea>
      {showModal && (
        <BottomSheetDetachedModal
          backgroundColor={theme.colors.background1}
          name={ModalName.TooltipContent}
          onClose={(): void => setShowModal(false)}>
          <Text p="spacing16" variant="bodyLarge">
            {content}
          </Text>
        </BottomSheetDetachedModal>
      )}
    </>
  )
}
