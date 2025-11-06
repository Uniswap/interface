import { FeatureFlags } from '@universe/gating'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Switch, Text } from 'ui/src'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { SwapProtectionInfoModal } from 'wallet/src/features/transactions/swap/modals/SwapProtectionModal'
import { useSwapProtectionSetting } from 'wallet/src/features/wallet/hooks'
import { SwapProtectionSetting, setSwapProtectionSetting } from 'wallet/src/features/wallet/slice'

export const SwapProtection: TransactionSettingConfig = {
  renderTitle: (t) => t('swap.settings.protection.title'),
  applicablePlatforms: [Platform.EVM],
  Description() {
    const { t } = useTranslation()
    const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)
    const privateRpcSupportedOnChain = isPrivateRpcSupportedOnChain(chainId)
    const chainName = getChainLabel(chainId)
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
    const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)
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

    return (
      <Switch
        checked={privateRpcSupportedOnChain && swapProtectionSetting === SwapProtectionSetting.On}
        disabled={!privateRpcSupportedOnChain}
        variant="branded"
        onCheckedChange={toggleSwapProtectionSetting}
      />
    )
  },
  InfoModal: SwapProtectionInfoModal,
  featureFlag: FeatureFlags.PrivateRpc,
}
