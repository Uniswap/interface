import { PropsWithChildren, ReactNode, useCallback, useRef, useState } from 'react'
import { Flex, TouchableArea } from 'ui/src'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { WarningModal, WarningModalProps } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { InfoTooltipProps } from 'uniswap/src/components/tooltip/InfoTooltipProps'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { isWebPlatform } from 'utilities/src/platform'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

type WarningInfoProps = {
  tooltipProps: Omit<InfoTooltipProps, 'button' | 'trigger'>
  modalProps: Omit<WarningModalProps, 'onClose' | 'isOpen'>
  infoButton?: ReactNode
  mobileBanner?: ReactNode
  trigger?: ReactNode
  triggerPlacement?: 'start' | 'end'
  analyticsTitle?: string
}
/**
 * Platform wrapper component used to display additional info either as a tooltip on web
 * or a modal on mobile
 */
export function WarningInfo({
  tooltipProps,
  modalProps,
  infoButton,
  mobileBanner,
  children,
  trigger = <InfoCircle color="$neutral3" size="$icon.12" />,
  triggerPlacement = 'end',
  analyticsTitle,
}: PropsWithChildren<WarningInfoProps>): JSX.Element {
  const trace = useTrace()
  const hasHoverBeenTracked = useRef<boolean>(false)

  const isPriceUXEnabled = usePriceUXEnabled()

  const [showModal, setShowModal] = useState(false)

  const handleTooltipOpenChange = useCallback(
    (isTooltipOpen = true): void => {
      if (!analyticsTitle) {
        return
      }

      if (hasHoverBeenTracked.current) {
        return
      }

      if (!isTooltipOpen) {
        return
      }

      hasHoverBeenTracked.current = true
      sendAnalyticsEvent(UniswapEventName.TooltipOpened, {
        ...trace,
        tooltip_name: analyticsTitle,
        is_price_ux_enabled: isPriceUXEnabled,
      })
    },
    [trace, analyticsTitle, isPriceUXEnabled],
  )

  if (isWebPlatform) {
    return (
      <InfoTooltip
        {...tooltipProps}
        button={infoButton}
        trigger={trigger}
        triggerPlacement={triggerPlacement}
        onOpenChange={handleTooltipOpenChange}
      >
        {children}
      </InfoTooltip>
    )
  }

  return (
    <>
      <TouchableArea
        flexShrink={1}
        onPress={(): void => {
          handleTooltipOpenChange()
          setShowModal(true)
        }}
      >
        <Flex row shrink alignItems="center" gap="$spacing4">
          {triggerPlacement === 'start' && trigger}
          {children}
          {triggerPlacement === 'end' && trigger}
        </Flex>
      </TouchableArea>
      <WarningModal isOpen={showModal} {...modalProps} onClose={(): void => setShowModal(false)}>
        {infoButton}
        {mobileBanner}
      </WarningModal>
    </>
  )
}
