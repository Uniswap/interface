import { SharedEventName } from '@uniswap/analytics-events'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { AnimatableCopyIcon, Flex, Popover, Separator, Text, TouchableArea, useIsTouchDevice } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useShadowPropsMedium } from 'ui/src/theme/shadows'
import { zIndexes } from 'ui/src/theme/zIndexes'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useBlockExplorerLogo } from 'uniswap/src/features/chains/logos'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { NumberType } from 'utilities/src/format/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import useCopyClipboard from '~/hooks/useCopyClipboard'

const iconButtonProps = {
  hitSlop: 8,
  hoverStyle: { opacity: 0.7 },
} as const

interface AddressHoverCardProps {
  address?: string
  platform: Platform
  children: ReactNode
}

export function AddressHoverCard({ address, platform, children }: AddressHoverCardProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const [isOpen, setIsOpen] = useState(false)
  const [isCopied, copyToClipboard] = useCopyClipboard(ONE_SECOND_MS)
  const chainId = platform === Platform.SVM ? UniverseChainId.Solana : UniverseChainId.Mainnet
  const BlockExplorerLogo = useBlockExplorerLogo(chainId)
  const shadowProps = useShadowPropsMedium()
  const isTouchDevice = useIsTouchDevice()

  const { data, loading } = usePortfolioTotalValue({
    evmAddress: platform === Platform.EVM ? address : undefined,
    svmAddress: platform === Platform.SVM ? address : undefined,
    enabled: isOpen && !!address,
  })

  const formattedBalance = convertFiatAmountFormatted(data?.balanceUSD, NumberType.PortfolioBalance)

  const handleCopyAddress = useCallback((): void => {
    if (!address) {
      return
    }

    copyToClipboard(address)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      }),
    )
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.CopyAddress,
    })
  }, [address, dispatch, copyToClipboard])

  const handleOpenExplorer = useCallback(async (): Promise<void> => {
    const explorerUrl = getExplorerLink({
      chainId,
      data: address,
      type: ExplorerDataType.ADDRESS,
    })
    await openUri({ uri: explorerUrl })
  }, [address, chainId])

  // Dismiss the popover when the user scrolls
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleScroll = (): void => {
      setIsOpen(false)
    }

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    return (): void => {
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [isOpen])

  // Disable hover cards on touch devices - hover interactions don't work well
  if (!address || isTouchDevice) {
    return <>{children}</>
  }

  // Prevents press events from bubbling to parent touchable areas
  const stopPressEventPropagation = {
    onPressIn: (e: { stopPropagation: () => void }) => e.stopPropagation(),
    onPressOut: (e: { stopPropagation: () => void }) => e.stopPropagation(),
    onPress: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  }

  return (
    <Popover hoverable open={isOpen} placement="bottom-start" stayInFrame allowFlip onOpenChange={setIsOpen}>
      <Popover.Trigger>
        <TouchableArea variant="unstyled" activeOpacity={1} {...stopPressEventPropagation}>
          {children}
        </TouchableArea>
      </Popover.Trigger>
      <Popover.Content
        animation="quick"
        backgroundColor="$surface4"
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth={1}
        p="$spacing16"
        zIndex={zIndexes.popover}
        enterStyle={{ opacity: 0, y: -4 }}
        exitStyle={{ opacity: 0, y: -4 }}
        $platform-web={{
          ...shadowProps['$platform-web'],
          backdropFilter: 'blur(12px)',
        }}
        {...stopPressEventPropagation}
      >
        <Flex gap="$spacing16" minWidth={320}>
          {/* Top section: Address info + action buttons */}
          <Flex row justifyContent="space-between" alignItems="center" gap="$spacing12">
            {/* Left: Avatar, name, and address */}
            <Flex shrink>
              <AddressDisplay
                showAccountIcon
                address={address}
                size={iconSizes.icon40}
                variant="subheading2"
                captionVariant="body3"
                captionTextColor="$neutral2"
                hideAddressInSubtitle={false}
              />
            </Flex>

            {/* Right: Copy and explorer buttons */}
            <Flex row gap="$spacing12" alignItems="center">
              <TouchableArea {...iconButtonProps} onPress={handleCopyAddress}>
                <AnimatableCopyIcon isCopied={isCopied} size={iconSizes.icon20} textColor="$neutral2" />
              </TouchableArea>
              <TouchableArea {...iconButtonProps} onPress={handleOpenExplorer}>
                <BlockExplorerLogo size={iconSizes.icon16} />
              </TouchableArea>
            </Flex>
          </Flex>

          <Separator />

          {/* Bottom section: Balance and 1D change */}
          <Flex gap="$spacing8">
            {/* Balance row */}
            <Flex row justifyContent="space-between" alignItems="center">
              <Text variant="body3" color="$neutral2">
                {t('portfolio.tokens.table.column.balance')}
              </Text>
              <Text variant="body3" color="$neutral1" loading={loading} loadingPlaceholderText="$00,000.00">
                {formattedBalance}
              </Text>
            </Flex>

            {/* 1D change row */}
            <Flex row justifyContent="space-between" alignItems="center">
              <Text variant="body3" color="$neutral2">
                {t('portfolio.tokens.table.column.change1d')}
              </Text>
              <RelativeChange
                change={data?.percentChange}
                absoluteChange={data?.absoluteChangeUSD}
                loading={loading}
                variant="body3"
                arrowSize="$icon.12"
              />
            </Flex>
          </Flex>
        </Flex>
      </Popover.Content>
    </Popover>
  )
}
