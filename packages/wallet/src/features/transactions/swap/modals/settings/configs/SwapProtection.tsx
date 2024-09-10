import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { isWeb, Text } from 'ui/src'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { Switch as NativeSwitch, WebSwitch } from 'wallet/src/components/buttons/Switch'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { SwapSettingConfig } from 'wallet/src/features/transactions/swap/modals/settings/configs/types'
import { SwapProtectionInfoModal } from 'wallet/src/features/transactions/swap/modals/SwapProtectionModal'
import { useSwapProtectionSetting } from 'wallet/src/features/wallet/hooks'
import { setSwapProtectionSetting, SwapProtectionSetting } from 'wallet/src/features/wallet/slice'

export const SwapProtection: SwapSettingConfig = {
  renderTitle: (t) => t('swap.settings.protection.title'),
  Description() {
    const { t } = useTranslation()
    const chainId = useSwapFormContext().derivedSwapInfo.chainId
    const privateRpcSupportedOnChain = isPrivateRpcSupportedOnChain(chainId)
    const chainName = UNIVERSE_CHAIN_INFO[chainId].label
    return (
      <Text color="$neutral2" variant="body3">
        {privateRpcSupportedOnChain
          ? t('swap.settings.protection.subtitle.supported', { chainName })
          : t('swap.settings.protection.subtitle.unavailable', { chainName })}
      </Text>
    )
  },
  Control() {
    const dispatch = useDispatch()
    const chainId = useSwapFormContext().derivedSwapInfo.chainId
    const privateRpcSupportedOnChain = isPrivateRpcSupportedOnChain(chainId)
    const swapProtectionSetting = useSwapProtectionSetting()

    const toggleSwapProtectionSetting = useCallback(() => {
      if (swapProtectionSetting === SwapProtectionSetting.On) {
        dispatch(setSwapProtectionSetting({ newSwapProtectionSetting: SwapProtectionSetting.Off }))
      }
      if (swapProtectionSetting === SwapProtectionSetting.Off) {
        dispatch(setSwapProtectionSetting({ newSwapProtectionSetting: SwapProtectionSetting.On }))
      }
    }, [dispatch, swapProtectionSetting])

    const Switch = isWeb ? WebSwitch : NativeSwitch

    return (
      <Switch
        disabled={!privateRpcSupportedOnChain}
        value={privateRpcSupportedOnChain && swapProtectionSetting === SwapProtectionSetting.On}
        onValueChange={toggleSwapProtectionSetting}
      />
    )
  },
  InfoModal: SwapProtectionInfoModal,
  featureFlag: FeatureFlags.PrivateRpc,
}
