import { isMobileWeb, isWebPlatform } from '@universe/environment'
import { Flex, TouchableArea } from '@universe/mycelium'
import { PropsWithChildren, ReactNode, useCallback, useRef, useState } from 'react'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { WarningModal, WarningModalProps } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { InfoTooltipProps } from 'uniswap/src/components/tooltip/InfoTooltipProps'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

/** The shell WarningInfo renders its info content in. */
export type WarningInfoShell = 'tooltip' | 'modal'

type WarningInfoProps = {
  tooltipProps: Omit<InfoTooltipProps, 'button' | 'trigger'>
  modalProps: Omit<WarningModalProps, 'onClose' | 'isOpen'>
  /**
   * Shown in both shells. Pass a function when the button styles itself per shell: it is called
   * with the shell this component picked, so callers never re-derive it from the platform.
   */
  infoButton?: ReactNode | ((shell: WarningInfoShell) => ReactNode)
  mobileBanner?: ReactNode
  trigger?: ReactNode
  triggerPlacement?: 'start' | 'end'
  analyticsTitle?: string
  showModalOnMobileWeb?: boolean
}

export function shouldRenderWarningInfoTooltip({
  isWebPlatform: platformIsWeb,
  isMobileWeb: platformIsMobileWeb,
  showModalOnMobileWeb,
}: {
  isWebPlatform: boolean
  isMobileWeb: boolean
  showModalOnMobileWeb: boolean
}): boolean {
  return platformIsWeb && !(platformIsMobileWeb && showModalOnMobileWeb)
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
  showModalOnMobileWeb = false,
}: PropsWithChildren<WarningInfoProps>): JSX.Element {
  const trace = useTrace()
  const hasHoverBeenTracked = useRef<boolean>(false)

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
      })
    },
    [trace, analyticsTitle],
  )

  if (shouldRenderWarningInfoTooltip({ isWebPlatform, isMobileWeb, showModalOnMobileWeb })) {
    return (
      <InfoTooltip
        {...tooltipProps}
        button={typeof infoButton === 'function' ? infoButton('tooltip') : infoButton}
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
        {typeof infoButton === 'function' ? infoButton('modal') : infoButton}
        {mobileBanner}
      </WarningModal>
    </>
  )
}
