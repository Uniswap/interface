import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { InfoCircleFilled, RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Switch, WebSwitch } from 'wallet/src/components/buttons/Switch'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { CHAIN_INFO, ChainId } from 'wallet/src/constants/chains'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers'
import { SwapProtectionInfoModal } from 'wallet/src/features/transactions/swap/modals/SwapProtectionModal'
import { SlippageSettingsRow } from 'wallet/src/features/transactions/swap/modals/settings/SlippageSettingsRow'
import { SlippageSettingsScreen } from 'wallet/src/features/transactions/swap/modals/settings/SlippageSettingsScreen'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { useSwapProtectionSetting } from 'wallet/src/features/wallet/hooks'
import { SwapProtectionSetting, setSwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { useAppDispatch } from 'wallet/src/state'
import { ModalName } from 'wallet/src/telemetry/constants'

enum SwapSettingsModalView {
  Options,
  Slippage,
}

export type SwapSettingsModalProps = {
  derivedSwapInfo: DerivedSwapInfo
  setCustomSlippageTolerance: (customSlippageTolerance: number | undefined) => void
  onClose?: () => void
}

// NOTE: This modal is shared between the old and new swap flows!
//       If you make changes to this modal, make sure it works for both flows.
export function SwapSettingsModal({
  derivedSwapInfo,
  setCustomSlippageTolerance,
  onClose,
}: SwapSettingsModalProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const [view, setView] = useState(SwapSettingsModalView.Options)

  const { customSlippageTolerance } = derivedSwapInfo
  const [customSlippageInput, setCustomSlippageInput] = useState<number | undefined>(
    customSlippageTolerance
  )

  const getTitle = (): string => {
    switch (view) {
      case SwapSettingsModalView.Options:
        return t('swap.settings.title')
      case SwapSettingsModalView.Slippage:
        return t('swap.slippage.settings.title')
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
            onSlippageChange={onSlippageChange}
          />
        )
      case SwapSettingsModalView.Slippage:
        return (
          <SlippageSettingsScreen
            derivedSwapInfo={derivedSwapInfo}
            onSlippageChange={setCustomSlippageTolerance}
          />
        )
    }
  }, [derivedSwapInfo, onSlippageChange, setCustomSlippageTolerance, view])

  const showSaveButton = isWeb && customSlippageInput !== customSlippageTolerance

  return (
    <BottomSheetModal
      alignment={isWeb ? 'top' : undefined}
      backgroundColor={colors.surface1.get()}
      name={ModalName.SwapSettings}
      onClose={onSettingsClose}>
      <Flex
        gap="$spacing16"
        px={isWeb ? '$spacing4' : '$spacing24'}
        py={isWeb ? '$spacing4' : '$spacing12'}>
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
          <Button
            fill
            color={showSaveButton ? '$accent1' : undefined}
            testID="swap-settings-close"
            theme="secondary"
            onPress={onSettingsClose}>
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
  setView,
}: {
  derivedSwapInfo: DerivedSwapInfo
  onSlippageChange: (slippage: number | undefined) => void
  setView: (newView: SwapSettingsModalView) => void
}): JSX.Element {
  const isMevBlockerFeatureEnabled = useFeatureFlag(FeatureFlags.MevBlocker)
  const { chainId } = derivedSwapInfo

  return (
    <Flex gap="$spacing16" py="$spacing12">
      <SlippageSettingsRow
        derivedSwapInfo={derivedSwapInfo}
        onPress={(): void => setView(SwapSettingsModalView.Slippage)}
        onSlippageChange={onSlippageChange}
      />
      {isMevBlockerFeatureEnabled && <SwapProtectionSettingsRow chainId={chainId} />}
    </Flex>
  )
}

function SwapProtectionSettingsRow({ chainId }: { chainId: ChainId }): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
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
  const chainName = CHAIN_INFO[chainId].label
  const subText = privateRpcSupportedOnChain
    ? t('swap.settings.protection.subtitle.supported', { chainName })
    : t('swap.settings.protection.subtitle.unavailable', { chainName })

  return (
    <>
      {showInfoModal && <SwapProtectionInfoModal onClose={(): void => setShowInfoModal(false)} />}
      <Flex gap="$spacing16">
        <Flex backgroundColor="$surface3" height={1} />
        <Flex row justifyContent="space-between">
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
              value={
                privateRpcSupportedOnChain && swapProtectionSetting === SwapProtectionSetting.On
              }
              onValueChange={toggleSwapProtectionSetting}
            />
          ) : (
            <Switch
              disabled={!privateRpcSupportedOnChain}
              value={
                privateRpcSupportedOnChain && swapProtectionSetting === SwapProtectionSetting.On
              }
              onValueChange={toggleSwapProtectionSetting}
            />
          )}
        </Flex>
      </Flex>
    </>
  )
}
