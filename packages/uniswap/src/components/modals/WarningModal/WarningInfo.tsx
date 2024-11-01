import { PropsWithChildren, ReactNode, useState } from 'react'
import { Flex, TouchableArea, isWeb } from 'ui/src'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { WarningModal, WarningModalProps } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { InfoTooltipProps } from 'uniswap/src/components/tooltip/InfoTooltipProps'

type WarningInfoProps = {
  tooltipProps: Omit<InfoTooltipProps, 'button' | 'trigger'>
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
      <InfoTooltip {...tooltipProps} button={infoButton} trigger={trigger} triggerPlacement={triggerPlacement}>
        {children}
      </InfoTooltip>
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
