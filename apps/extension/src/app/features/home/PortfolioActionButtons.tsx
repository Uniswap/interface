import { SharedEventName } from '@uniswap/analytics-events'
import { cloneElement, memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInterfaceBuyNavigator } from 'src/app/features/for/utils'
import { AppRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Flex, Text, getTokenValue, useMedia } from 'ui/src'
import { ArrowDownCircle, Bank, CoinConvert, SendAction } from 'ui/src/components/icons'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestnetModeModal } from 'uniswap/src/features/testnets/TestnetModeModal'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'

const ICON_COLOR = '$accent1'

type ActionButtonCommonProps = {
  label: string
  Icon: JSX.Element
}

// accepts an `onClick` prop or a `url` prop, but not both or neither
type ActionButtonProps =
  | (ActionButtonCommonProps & {
      onClick: () => void
      url?: never
    })
  | (ActionButtonCommonProps & {
      url: string
      onClick?: never
    })

function ActionButton({ label, Icon, onClick, url }: ActionButtonProps): JSX.Element {
  const actionHandler = url
    ? // if it has a url prop, open it in a new tab
      (): void => {
        // false positive because of .open
        window.open(url, '_blank')
      }
    : // otherwise call the onClick function
      onClick

  return (
    // TODO(EXT-248): Change to TouchableArea
    // https://linear.app/uniswap/issue/EXT-248/need-web-equivalent-of-touchablearea
    <Flex
      fill
      alignItems="flex-start"
      backgroundColor="$accent2"
      borderRadius="$rounded16"
      flexBasis={1}
      gap="$spacing12"
      hoverStyle={{ cursor: 'pointer', opacity: 0.8 }}
      justifyContent="space-between"
      // Reduced button label line height to 11 as suggested by design to eliminate extra bottom space.
      pb={11}
      pressStyle={{ opacity: 0.5 }}
      pt="$spacing12"
      px="$spacing12"
      userSelect="none"
      onPress={actionHandler}
    >
      {cloneElement(Icon, { color: ICON_COLOR, size: getTokenValue('$icon.24') })}
      <Text color="$accent1" fontWeight="600" variant="buttonLabel2">
        {label}
      </Text>
    </Flex>
  )
}

export const PortfolioActionButtons = memo(function _PortfolioActionButtons(): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const { isTestnetModeEnabled } = useEnabledChains()

  const onSendClick = (): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      screen: ExtensionScreens.Home,
      element: ElementName.Send,
    })
    navigate(AppRoutes.Send)
  }

  const onSwapClick = (): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      screen: ExtensionScreens.Home,
      element: ElementName.Swap,
    })
    navigate(AppRoutes.Swap)
  }

  const onReceiveClick = (): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      screen: ExtensionScreens.Home,
      element: ElementName.Receive,
    })
    navigate(AppRoutes.Receive)
  }

  const [isTestnetWarningModalOpen, setIsTestnetWarningModalOpen] = useState(false)
  const handleTestnetWarningModalClose = useCallback(() => {
    setIsTestnetWarningModalOpen(false)
  }, [])

  const onBuyNavigate = useInterfaceBuyNavigator(ElementName.Buy)
  const onBuyClick = (): void => {
    if (isTestnetModeEnabled) {
      setIsTestnetWarningModalOpen(true)
    } else {
      onBuyNavigate()
    }
  }

  const isGrid = media.sm

  return (
    <Flex flexDirection={isGrid ? 'column' : 'row'} gap="$spacing8">
      <TestnetModeModal
        unsupported
        isOpen={isTestnetWarningModalOpen}
        descriptionCopy={t('tdp.noTestnetSupportDescription')}
        onClose={handleTestnetWarningModalClose}
      />
      <Flex row shrink gap="$spacing8" width={isGrid ? '100%' : '50%'}>
        <ActionButton Icon={<CoinConvert />} label={t('home.label.swap')} onClick={onSwapClick} />
        <ActionButton Icon={<Bank />} label={t('home.label.buy')} onClick={onBuyClick} />
      </Flex>
      <Flex row shrink gap="$spacing8" width={isGrid ? '100%' : '50%'}>
        <ActionButton Icon={<SendAction />} label={t('home.label.send')} onClick={onSendClick} />
        <ActionButton Icon={<ArrowDownCircle />} label={t('home.label.receive')} onClick={onReceiveClick} />
      </Flex>
    </Flex>
  )
})
