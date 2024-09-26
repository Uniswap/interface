import { PropsWithChildren, ReactNode, useState } from 'react'
import { Flex, TouchableArea, isWeb } from 'ui/src'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { WarningModal, WarningModalProps } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningTooltip } from 'uniswap/src/components/modals/WarningModal/WarningTooltip'
import { WarningTooltipProps } from 'uniswap/src/components/modals/WarningModal/WarningTooltipProps'

type WarningInfoProps = {
  tooltipProps: Omit<WarningTooltipProps, 'button' | 'trigger'>
  modalProps: Omit<WarningModalProps, 'onClose' | 'isOpen'>
  infoButton?: ReactNode
  trigger?: ReactNode
  triggerPlacement?: 'start' | 'end'
}
/**
 * Platform wrapper component used to display additional info either as a tooltip on web
 * or a modal on mobile
 */
export function WarningInfo({
  tooltipProps,
  modalProps,
  infoButton,
  children,
  trigger = <InfoCircle color="$neutral3" size="$icon.16" />,
  triggerPlacement = 'end',
}: PropsWithChildren<WarningInfoProps>): JSX.Element {
  const [showModal, setShowModal] = useState(false)

  if (isWeb) {
    return (
      <WarningTooltip {...tooltipProps} button={infoButton} trigger={trigger} triggerPlacement={triggerPlacement}>
        {children}
      </WarningTooltip>
    )
  }

  return (
    <>
      <TouchableArea flexShrink={1} onPress={(): void => setShowModal(true)}>
        <Flex row shrink alignItems="center" gap="$spacing4">
          {triggerPlacement === 'start' && trigger}
          {children}
          {triggerPlacement === 'end' && trigger}
        </Flex>
      </TouchableArea>
      <WarningModal isOpen={showModal} {...modalProps} onClose={(): void => setShowModal(false)}>
        {infoButton}
      </WarningModal>
    </>
  )
}
