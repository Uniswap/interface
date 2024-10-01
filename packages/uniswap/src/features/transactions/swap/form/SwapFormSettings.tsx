import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { Eye } from 'ui/src/components/icons/Eye'
import { Settings } from 'ui/src/components/icons/Settings'
import { iconSizes } from 'ui/src/theme'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ViewOnlyModal } from 'uniswap/src/features/transactions/modals/ViewOnlyModal'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapSettingsModal } from 'uniswap/src/features/transactions/swap/settings/SwapSettingsModal'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { isInterface, isMobileApp } from 'utilities/src/platform'

export function SwapFormSettings({ customSettings }: { customSettings: SwapSettingConfig[] }): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const colors = useSporeColors()

  const account = useAccountMeta()
  const { customSlippageTolerance } = useSwapFormContext()

  const [showSwapSettingsModal, setShowSettingsModal] = useState(false)
  const [showViewOnlyModal, setShowViewOnlyModal] = useState(false)

  const onPressSwapSettings = useCallback((): void => {
    setShowSettingsModal(true)
    dismissNativeKeyboard()
  }, [])

  const onPressViewOnlyModal = useCallback((): void => {
    setShowViewOnlyModal(true)
  }, [])

  const onCloseSettingsModal = useCallback(() => setShowSettingsModal(false), [])

  const isViewOnlyWallet = account?.type === AccountType.Readonly

  const topAlignment = isInterface ? -38 : 6
  const rightAlignment = isMobileApp ? 24 : 4

  return (
    <Flex row gap="$spacing4" position="absolute" top={topAlignment} right={rightAlignment} zIndex="$default">
      <SwapSettingsModal
        customSettings={customSettings}
        isOpen={showSwapSettingsModal}
        onClose={onCloseSettingsModal}
      />
      <ViewOnlyModal isOpen={showViewOnlyModal} onDismiss={(): void => setShowViewOnlyModal(false)} />
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
            <Eye color={colors.neutral2.get()} size={iconSizes.icon16} />
            <Text color="$neutral2" variant="buttonLabel2">
              {t('swap.header.viewOnly')}
            </Text>
          </Flex>
        </TouchableArea>
      )}

      {!isViewOnlyWallet && (
        <TouchableArea hapticFeedback testID={TestID.SwapSettings} onPress={onPressSwapSettings}>
          <Flex
            centered
            row
            backgroundColor={customSlippageTolerance ? '$surface2' : '$transparent'}
            borderRadius="$roundedFull"
            gap="$spacing4"
            px={customSlippageTolerance ? '$spacing8' : '$spacing4'}
            py="$spacing4"
          >
            {customSlippageTolerance ? (
              <Text color="$neutral2" variant="buttonLabel3">
                {formatPercent(customSlippageTolerance)}
              </Text>
            ) : null}
            <Settings color={colors.neutral2.get()} size={isWeb ? iconSizes.icon20 : iconSizes.icon24} />
          </Flex>
        </TouchableArea>
      )}
    </Flex>
  )
}
