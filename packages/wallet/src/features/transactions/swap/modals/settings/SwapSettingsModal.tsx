import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, Flex, Separator, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { InfoCircleFilled, RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TradeProtocolPreference } from 'uniswap/src/features/transactions/transactionState/types'
import { WalletChainId } from 'uniswap/src/types/chains'
import { Switch, WebSwitch } from 'wallet/src/components/buttons/Switch'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers'
import { SwapProtectionInfoModal } from 'wallet/src/features/transactions/swap/modals/SwapProtectionModal'
import {
  ProtocolPreferenceScreen,
  getTitleFromProtocolPreference,
} from 'wallet/src/features/transactions/swap/modals/settings/ProtocolPreferenceScreen'
import { SlippageSettingsRow } from 'wallet/src/features/transactions/swap/modals/settings/SlippageSettingsRow'
import { SlippageSettingsScreen } from 'wallet/src/features/transactions/swap/modals/settings/SlippageSettingsScreen'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { useSwapProtectionSetting } from 'wallet/src/features/wallet/hooks'
import { SwapProtectionSetting, setSwapProtectionSetting } from 'wallet/src/features/wallet/slice'

enum SwapSettingsModalView {
  Options,
  Slippage,
  RoutePreference,
}

export type SwapSettingsModalProps = {
  derivedSwapInfo: DerivedSwapInfo
  setCustomSlippageTolerance: (customSlippageTolerance: number | undefined) => void
  tradeProtocolPreference: TradeProtocolPreference
  setTradeProtocolPreference: (tradeProtocolPreference: TradeProtocolPreference) => void
  onClose?: () => void
  isOpen: boolean
}

export function SwapSettingsModal({
  derivedSwapInfo,
  setCustomSlippageTolerance,
  tradeProtocolPreference,
  setTradeProtocolPreference,
  onClose,
  isOpen,
}: SwapSettingsModalProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const [view, setView] = useState(SwapSettingsModalView.Options)

  const { customSlippageTolerance } = derivedSwapInfo
  const [customSlippageInput, setCustomSlippageInput] = useState<number | undefined>(customSlippageTolerance)

  const getTitle = (): string => {
    switch (view) {
      case SwapSettingsModalView.Options:
        return t('swap.settings.title')
      case SwapSettingsModalView.Slippage:
        return t('swap.slippage.settings.title')
      case SwapSettingsModalView.RoutePreference:
        return t('swap.settings.routingPreference.title')
    }
  }

  const onSlippageChange = useCallback((slippage: number | undefined) => {
    setCustomSlippageInput(slippage)
  }, [])

  const onSettingsClose = useCallback((): void => {
    if (isWeb) {
      setCustomSlippageTolerance(customSlippageInput)
    }
    onClose?.()
  }, [customSlippageInput, onClose, setCustomSlippageTolerance])

  const innerContent = useMemo(() => {
    switch (view) {
      case SwapSettingsModalView.Options:
        return (
          <SwapSettingsOptions
            derivedSwapInfo={derivedSwapInfo}
            setView={setView}
            tradeProtocolPreference={tradeProtocolPreference}
            onSlippageChange={onSlippageChange}
          />
        )
      case SwapSettingsModalView.Slippage:
        return (
          <SlippageSettingsScreen derivedSwapInfo={derivedSwapInfo} onSlippageChange={setCustomSlippageTolerance} />
        )
      case SwapSettingsModalView.RoutePreference:
        return (
          <ProtocolPreferenceScreen
            setTradeProtocolPreference={setTradeProtocolPreference}
            tradeProtocolPreference={tradeProtocolPreference}
          />
        )
    }
  }, [
    derivedSwapInfo,
    onSlippageChange,
    setCustomSlippageTolerance,
    setTradeProtocolPreference,
    tradeProtocolPreference,
    view,
  ])

  const showSaveButton = isWeb && customSlippageInput !== customSlippageTolerance

  return (
    <BottomSheetModal
      alignment={isWeb ? 'top' : undefined}
      backgroundColor={colors.surface1.get()}
      isModalOpen={isOpen}
      name={ModalName.SwapSettings}
      onClose={onSettingsClose}
    >
      <Flex gap="$spacing16" px={isWeb ? '$spacing4' : '$spacing24'} py={isWeb ? '$spacing4' : '$spacing12'}>
        <Flex row justifyContent="space-between">
          <TouchableArea onPress={(): void => setView(SwapSettingsModalView.Options)}>
            <RotatableChevron
              color={view === SwapSettingsModalView.Options ? '$transparent' : '$neutral3'}
              height={iconSizes.icon24}
              width={iconSizes.icon24}
            />
          </TouchableArea>
          <Text textAlign="center" variant="body1">
            {getTitle()}
          </Text>
          <Flex width={iconSizes.icon24} />
        </Flex>
        {innerContent}
        <Flex centered row>
          <Button fill testID="swap-settings-close" theme="secondary" onPress={onSettingsClose}>
            {showSaveButton ? t('common.button.save') : t('common.button.close')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

function SwapSettingsOptions({
  derivedSwapInfo,
  onSlippageChange,
  tradeProtocolPreference,
  setView,
}: {
  derivedSwapInfo: DerivedSwapInfo
  onSlippageChange: (slippage: number | undefined) => void
  tradeProtocolPreference: TradeProtocolPreference
  setView: (newView: SwapSettingsModalView) => void
}): JSX.Element {
  const { t } = useTranslation()
  const { chainId } = derivedSwapInfo

  const isMevBlockerFeatureEnabled = useFeatureFlag(FeatureFlags.MevBlocker)
  const isOptionalRoutingEnabled = useFeatureFlag(FeatureFlags.OptionalRouting)

  const tradeProtocolPreferenceTitle = getTitleFromProtocolPreference(tradeProtocolPreference, t)

  return (
    <Flex gap="$spacing16" py="$spacing12">
      <SlippageSettingsRow
        derivedSwapInfo={derivedSwapInfo}
        onPress={(): void => setView(SwapSettingsModalView.Slippage)}
        onSlippageChange={onSlippageChange}
      />
      <Separator backgroundColor="$surface3" />
      {isMevBlockerFeatureEnabled && <SwapProtectionSettingsRow chainId={chainId} />}
      {isOptionalRoutingEnabled && (
        <>
          <Separator backgroundColor="$surface3" />
          <Flex centered row gap="$spacing16" justifyContent="space-between">
            <Text color="$neutral1" flexShrink={1} variant="subheading2">
              {t('swap.settings.routingPreference.title')}
            </Text>
            <TouchableArea flexShrink={1} onPress={(): void => setView(SwapSettingsModalView.RoutePreference)}>
              <Flex row alignItems="center" gap="$spacing4" justifyContent="flex-end">
                <Text color="$neutral2" flexWrap="wrap" variant="subheading2">
                  {tradeProtocolPreferenceTitle}
                </Text>
                <RotatableChevron color="$neutral3" direction="right" height={iconSizes.icon24} />
              </Flex>
            </TouchableArea>
          </Flex>
        </>
      )}
    </Flex>
  )
}

function SwapProtectionSettingsRow({ chainId }: { chainId: WalletChainId }): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const swapProtectionSetting = useSwapProtectionSetting()

  const toggleSwapProtectionSetting = useCallback(() => {
    if (swapProtectionSetting === SwapProtectionSetting.On) {
      dispatch(setSwapProtectionSetting({ newSwapProtectionSetting: SwapProtectionSetting.Off }))
    }
    if (swapProtectionSetting === SwapProtectionSetting.Off) {
      dispatch(setSwapProtectionSetting({ newSwapProtectionSetting: SwapProtectionSetting.On }))
    }
  }, [dispatch, swapProtectionSetting])

  const [showInfoModal, setShowInfoModal] = useState(false)

  const privateRpcSupportedOnChain = isPrivateRpcSupportedOnChain(chainId)
  const chainName = UNIVERSE_CHAIN_INFO[chainId].label
  const subText = privateRpcSupportedOnChain
    ? t('swap.settings.protection.subtitle.supported', { chainName })
    : t('swap.settings.protection.subtitle.unavailable', { chainName })

  return (
    <>
      {showInfoModal && <SwapProtectionInfoModal onClose={(): void => setShowInfoModal(false)} />}
      <Flex centered row gap="$spacing16" justifyContent="space-between">
        <TouchableArea onPress={(): void => setShowInfoModal(true)}>
          <Flex gap="$spacing4">
            <Flex row alignItems="center" gap="$spacing4">
              <Text color="$neutral1" variant="subheading2">
                {t('swap.settings.protection.title')}
              </Text>
              <InfoCircleFilled color="$neutral3" size={iconSizes.icon16} />
            </Flex>
            <Text color="$neutral2" variant="body3">
              {subText}
            </Text>
          </Flex>
        </TouchableArea>
        {isWeb ? (
          <WebSwitch
            disabled={!privateRpcSupportedOnChain}
            value={privateRpcSupportedOnChain && swapProtectionSetting === SwapProtectionSetting.On}
            onValueChange={toggleSwapProtectionSetting}
          />
        ) : (
          <Switch
            disabled={!privateRpcSupportedOnChain}
            value={privateRpcSupportedOnChain && swapProtectionSetting === SwapProtectionSetting.On}
            onValueChange={toggleSwapProtectionSetting}
          />
        )}
      </Flex>
    </>
  )
}
