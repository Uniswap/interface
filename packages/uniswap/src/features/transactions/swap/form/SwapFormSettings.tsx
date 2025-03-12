import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorTokens, Flex, FlexProps, Popover, Text, TouchableArea } from 'ui/src'
import { Eye } from 'ui/src/components/icons/Eye'
import { IconSizeTokens, iconSizes } from 'ui/src/theme'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { ViewOnlyModal } from 'uniswap/src/features/transactions/modals/ViewOnlyModal'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { SwapFormSettingsButton } from 'uniswap/src/features/transactions/swap/form/SwapFormSettingsButton'
import SlippageWarningModal from 'uniswap/src/features/transactions/swap/settings/SlippageWarningModal'
import { TransactionSettingsModal } from 'uniswap/src/features/transactions/swap/settings/TransactionSettingsModal'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/settings/useSlippageSettings'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { isExtension, isInterface, isMobileApp, isMobileWeb } from 'utilities/src/platform'

export function SwapFormSettings({
  settings,
  adjustTopAlignment = true,
  adjustRightAlignment = true,
  position = 'absolute',
  iconColor = '$neutral2',
  iconSize,
  defaultTitle,
  isBridgeTrade,
}: {
  settings: SwapSettingConfig[]
  adjustTopAlignment?: boolean
  adjustRightAlignment?: boolean
  position?: FlexProps['position']
  iconColor?: ColorTokens
  iconSize?: IconSizeTokens
  defaultTitle?: string
  isBridgeTrade?: boolean
}): JSX.Element {
  const { t } = useTranslation()

  const account = useAccountMeta()
  const { customSlippageTolerance, slippageWarningModalSeen, updateTransactionSettings } =
    useTransactionSettingsContext()
  const { autoSlippageTolerance } = useSlippageSettings()

  const [showTransactionSettingsModal, setShowSettingsModal] = useState(false)
  const [showViewOnlyModal, setShowViewOnlyModal] = useState(false)
  const [showSlippageWarningModal, setShowSlippageWarningModal] = useState(false)

  const onPressSwapSettings = useCallback((): void => {
    setShowSettingsModal(true)
    dismissNativeKeyboard()
  }, [])

  const onPressViewOnlyModal = useCallback((): void => {
    setShowViewOnlyModal(true)
  }, [])

  const onCloseSettingsModal = useCallback(() => {
    const shouldShowSlippageWarning =
      !slippageWarningModalSeen && customSlippageTolerance && customSlippageTolerance >= 20

    if (shouldShowSlippageWarning) {
      // Leave swap settings modal open for mobile app (to layer modals), but close for web apps
      if (!isMobileApp) {
        setShowSettingsModal(false)
      }
      // Delay showing the slippage warning modal to avoid conflict with popover dismissal for a smoother UX
      setTimeout(() => {
        setShowSlippageWarningModal(true)
        updateTransactionSettings({ slippageWarningModalSeen: true })
      }, 80)
    } else {
      setShowSettingsModal(false)
    }
  }, [slippageWarningModalSeen, customSlippageTolerance, updateTransactionSettings])

  const isViewOnlyWallet = account?.type === AccountType.Readonly

  const topAlignment = adjustTopAlignment ? (isInterface ? -38 : 6) : 0
  const rightAlignment = adjustRightAlignment ? (isMobileApp ? 24 : 4) : 0
  const popoverOffset = isInterface
    ? { crossAxis: adjustRightAlignment ? 0 : 8, mainAxis: adjustTopAlignment ? 0 : 8 }
    : undefined

  const showCustomSlippage = customSlippageTolerance && !isBridgeTrade

  const showSettingsIconTooltip = useMemo(() => {
    const meetsPlatformConditions = (isInterface || isExtension) && !isMobileWeb
    const exceedsSlippageTolerance = !!customSlippageTolerance && customSlippageTolerance > autoSlippageTolerance

    return meetsPlatformConditions && exceedsSlippageTolerance && !showTransactionSettingsModal
  }, [customSlippageTolerance, showTransactionSettingsModal, autoSlippageTolerance])

  return (
    <>
      <ViewOnlyModal isOpen={showViewOnlyModal} onDismiss={(): void => setShowViewOnlyModal(false)} />
      <SlippageWarningModal isOpen={showSlippageWarningModal} onClose={() => setShowSlippageWarningModal(false)} />
      <Flex row gap="$spacing4" position={position} top={topAlignment} right={rightAlignment} zIndex="$default">
        {isViewOnlyWallet && (
          <TouchableArea
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            justifyContent="center"
            px="$spacing8"
            py="$spacing4"
            onPress={onPressViewOnlyModal}
          >
            <Flex row alignItems="center" gap="$spacing4">
              <Eye color="$neutral2" size={iconSizes.icon16} />
              <Text color="$neutral2" variant="buttonLabel2">
                {t('swap.header.viewOnly')}
              </Text>
            </Flex>
          </TouchableArea>
        )}

        {!isViewOnlyWallet && (
          <Popover
            offset={popoverOffset}
            placement="bottom-end"
            open={showTransactionSettingsModal}
            onOpenChange={(open: boolean) => {
              // Only close on interface because SwapSettings are rendered in a modal on mobile/extension
              // and when click is triggered inside extension Modal it causes onOpenChange to trigger
              if (!open && isInterface) {
                onCloseSettingsModal()
              }
            }}
          >
            <Flex>
              <SwapFormSettingsButton
                showCustomSlippage={!!showCustomSlippage}
                customSlippageTolerance={customSlippageTolerance}
                showTooltip={showSettingsIconTooltip}
                iconColor={iconColor}
                iconSize={iconSize}
                onPress={onPressSwapSettings}
              />
              <TransactionSettingsModal
                settings={settings}
                defaultTitle={defaultTitle}
                isOpen={showTransactionSettingsModal}
                onClose={onCloseSettingsModal}
              />
            </Flex>
          </Popover>
        )}
      </Flex>
    </>
  )
}
