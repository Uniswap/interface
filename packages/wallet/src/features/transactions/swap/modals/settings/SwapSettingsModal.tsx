import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Icons, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { Switch } from 'wallet/src/components/buttons/Switch'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { CHAIN_INFO, ChainId } from 'wallet/src/constants/chains'
import { MAX_AUTO_SLIPPAGE_TOLERANCE } from 'wallet/src/constants/transactions'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers'
import { SwapProtectionInfoModal } from 'wallet/src/features/transactions/swap/modals/SwapProtectionModal'
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

  const { customSlippageTolerance, autoSlippageTolerance, chainId } = derivedSwapInfo
  const isCustomSlippage = !!customSlippageTolerance
  const currentSlippage =
    customSlippageTolerance ?? autoSlippageTolerance ?? MAX_AUTO_SLIPPAGE_TOLERANCE

  const getTitle = (): string => {
    switch (view) {
      case SwapSettingsModalView.Options:
        return t('swap.settings.title')
      case SwapSettingsModalView.Slippage:
        return t('swap.slippage.settings.title')
    }
  }

  const innerContent = useMemo(() => {
    switch (view) {
      case SwapSettingsModalView.Options:
        return (
          <SwapSettingsOptions
            chainId={chainId}
            isCustomSlippage={isCustomSlippage}
            setView={setView}
            slippage={currentSlippage}
          />
        )
      case SwapSettingsModalView.Slippage:
        return (
          <SlippageSettingsScreen
            derivedSwapInfo={derivedSwapInfo}
            setCustomSlippageTolerance={setCustomSlippageTolerance}
          />
        )
    }
  }, [
    chainId,
    currentSlippage,
    derivedSwapInfo,
    isCustomSlippage,
    setCustomSlippageTolerance,
    view,
  ])

  return (
    <BottomSheetModal
      backgroundColor={colors.surface1.get()}
      isCentered={isWeb}
      name={ModalName.SwapSettings}
      onClose={onClose}>
      <Flex gap="$spacing16" px="$spacing24" py="$spacing12">
        <Flex row justifyContent="space-between">
          <TouchableArea onPress={(): void => setView(SwapSettingsModalView.Options)}>
            <Icons.RotatableChevron
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
          <Button fill testID="swap-settings-close" theme="secondary" onPress={onClose}>
            {t('common.button.close')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

function SwapSettingsOptions({
  slippage,
  isCustomSlippage,
  setView,
  chainId,
}: {
  slippage: number
  isCustomSlippage: boolean
  setView: (newView: SwapSettingsModalView) => void
  chainId: ChainId
}): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const isMevBlockerFeatureEnabled = useFeatureFlag(FEATURE_FLAGS.MevBlocker)

  return (
    <Flex gap="$spacing16" py="$spacing12">
      <Flex row justifyContent="space-between">
        <Text color="$neutral1" variant="subheading2">
          {t('swap.settings.slippage.control.title')}
        </Text>
        <TouchableArea onPress={(): void => setView(SwapSettingsModalView.Slippage)}>
          <Flex row gap="$spacing8">
            {!isCustomSlippage ? (
              <Flex centered backgroundColor="$accent2" borderRadius="$roundedFull" px="$spacing8">
                <Text color="$accent1" variant="buttonLabel4">
                  {t('swap.settings.slippage.control.auto')}
                </Text>
              </Flex>
            ) : null}
            <Text color="$neutral2" variant="subheading2">
              {formatPercent(slippage)}
            </Text>
            <Icons.RotatableChevron
              color="$neutral3"
              direction="end"
              height={iconSizes.icon24}
              width={iconSizes.icon24}
            />
          </Flex>
        </TouchableArea>
      </Flex>
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
                <Icons.InfoCircleFilled color="$neutral3" size={iconSizes.icon16} />
              </Flex>
              <Text color="$neutral2" variant="body3">
                {subText}
              </Text>
            </Flex>
          </TouchableArea>
          <Switch
            disabled={!privateRpcSupportedOnChain}
            value={privateRpcSupportedOnChain && swapProtectionSetting === SwapProtectionSetting.On}
            onValueChange={toggleSwapProtectionSetting}
          />
        </Flex>
      </Flex>
    </>
  )
}
