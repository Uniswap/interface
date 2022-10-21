import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React, { useState } from 'react'
import { useAppTheme } from 'src/app/hooks'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import Tooltip from 'src/assets/icons/tooltip.svg'
import { Button } from 'src/components/buttons/Button'
import { BottomSheetDetachedModal } from 'src/components/modals/BottomSheetModal'
import { Modal } from 'src/components/modals/Modal'
import { Text } from 'src/components/Text'
import { ModalName } from 'src/features/telemetry/constants'
import { Theme } from 'src/styles/theme'

const DEFAULT_ICON_SIZE = 20

type Props = {
  title: string
  lines: string[]
  size?: number
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function TooltipButton({ title, lines, size, ...rest }: Props) {
  const [showModal, setShowModal] = useState(false)
  return (
    <>
      <Button onPress={() => setShowModal(true)} {...rest}>
        <Tooltip height={size ?? DEFAULT_ICON_SIZE} width={size ?? DEFAULT_ICON_SIZE} />
      </Button>
      <Modal hide={() => setShowModal(false)} title={title} visible={showModal}>
        {lines.map((l) => (
          <Text mt="sm" textAlign="center" variant="bodyLarge">
            {l}
          </Text>
        ))}
      </Modal>
    </>
  )
}

type InfoButtonProps = {
  content: string
  size?: number
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function TooltipInfoButton({ size, content, ...rest }: InfoButtonProps) {
  const theme = useAppTheme()
  const [showModal, setShowModal] = useState(false)
  return (
    <>
      <Button onPress={() => setShowModal(true)} {...rest}>
        <InfoCircle
          color={theme.colors.textOnBrightSecondary}
          height={size ?? DEFAULT_ICON_SIZE}
          width={size ?? DEFAULT_ICON_SIZE}
        />
      </Button>
      <BottomSheetDetachedModal
        backgroundColor={theme.colors.background1}
        isVisible={showModal}
        name={ModalName.TooltipContent}
        onClose={() => setShowModal(false)}>
        <Text p="md" variant="bodyLarge">
          {content}
        </Text>
      </BottomSheetDetachedModal>
    </>
  )
}
