import { SharedEventName } from '@uniswap/analytics-events'
import { cloneElement, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ComingSoon } from 'src/app/components/ComingSoon'
import { useInterfaceBuyNavigator } from 'src/app/features/for/utils'
import { AppRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Flex, Text, getTokenValue, useMedia } from 'ui/src'
import { ArrowDownCircle, Buy, CoinConvert, SendAction } from 'ui/src/components/icons'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
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
        // eslint-disable-next-line security/detect-non-literal-fs-filename
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
      p="$spacing12"
      pressStyle={{ opacity: 0.5 }}
      userSelect="none"
      onPress={actionHandler}
    >
      {cloneElement(Icon, { color: ICON_COLOR, size: getTokenValue('$icon.24') })}
      <Text color="$accent1" fontWeight="600" variant="buttonLabel3">
        {label}
      </Text>
    </Flex>
  )
}

export const PortfolioActionButtons = memo(function _PortfolioActionButtons(): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()

  const isExtensionBuyEnabled = useFeatureFlag(FeatureFlags.ExtensionBuyButton)

  const onSendClick = (): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      screen: ExtensionScreens.Home,
      element: ElementName.Send,
    })
    navigate(AppRoutes.Transfer)
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

  const onBuyClick = useInterfaceBuyNavigator(ElementName.Buy)

  const isGrid = media.sm

  const ComingSoonBuyButton = (
    <Flex fill backgroundColor="$accent2" borderRadius="$rounded16" flexBasis={1} opacity={0.5} p="$spacing12">
      <ComingSoon placement="bottom">
        <Flex fill alignItems="flex-start" gap="$spacing12" justifyContent="space-between" userSelect="none">
          <Buy color={ICON_COLOR} size="$icon.24" />
          <Text color="$accent1" fontWeight="600" variant="buttonLabel3">
            {t('home.label.buy')}
          </Text>
        </Flex>
      </ComingSoon>
    </Flex>
  )

  return (
    <Flex flexDirection={isGrid ? 'column' : 'row'} gap="$spacing8">
      <Flex row shrink gap="$spacing8" width={isGrid ? '100%' : '50%'}>
        <ActionButton Icon={<CoinConvert />} label={t('home.label.swap')} onClick={onSwapClick} />
        {isExtensionBuyEnabled ? (
          <ActionButton Icon={<Buy />} label={t('home.label.buy')} onClick={onBuyClick} />
        ) : (
          ComingSoonBuyButton
        )}
      </Flex>
      <Flex row shrink gap="$spacing8" width={isGrid ? '100%' : '50%'}>
        <ActionButton Icon={<SendAction />} label={t('home.label.send')} onClick={onSendClick} />
        <ActionButton Icon={<ArrowDownCircle />} label={t('home.label.receive')} onClick={onReceiveClick} />
      </Flex>
    </Flex>
  )
})
