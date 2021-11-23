import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React, { useState } from 'react'
import Tooltip from 'src/assets/icons/tooltip.svg'
import { Button } from 'src/components/buttons/Button'
import { Modal } from 'src/components/modals/Modal'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

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
        <Tooltip width={size ?? 20} height={size ?? 20} />
      </Button>
      <Modal title={title} hide={() => setShowModal(false)} visible={showModal}>
        {lines.map((l) => (
          <Text textAlign="center" variant="body" mt="sm">
            {l}
          </Text>
        ))}
      </Modal>
    </>
  )
}
