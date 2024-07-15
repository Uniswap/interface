import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { Flex, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { Eye, Settings, X } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { TradeProtocolPreference } from 'uniswap/src/features/transactions/transactionState/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { useTransactionModalContext } from 'wallet/src/features/transactions/contexts/TransactionModalContext'
import { ViewOnlyModal } from 'wallet/src/features/transactions/swap/modals/ViewOnlyModal'
import { SwapSettingsModal } from 'wallet/src/features/transactions/swap/modals/settings/SwapSettingsModal'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function SwapFormHeader(): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const colors = useSporeColors()
  const account = useActiveAccountWithThrow()

  const { onClose } = useTransactionModalContext()
  const { updateSwapForm, customSlippageTolerance, derivedSwapInfo, tradeProtocolPreference } = useSwapFormContext()

  const [showSwapSettingsModal, setShowSettingsModal] = useState(false)
  const [showViewOnlyModal, setShowViewOnlyModal] = useState(false)

  const onPressSwapSettings = useCallback((): void => {
    setShowSettingsModal(true)
    Keyboard.dismiss()
  }, [])

  const onPressViewOnlyModal = useCallback((): void => {
    setShowViewOnlyModal(true)
  }, [])

  const setCustomSlippageTolerance = useCallback(
    (newCustomeSlippageTolerance: number | undefined): void => {
      updateSwapForm({
        customSlippageTolerance: newCustomeSlippageTolerance,
      })
    },
    [updateSwapForm],
  )

  const setTradeProtocolPreference = useCallback(
    (newProtocolPreference: TradeProtocolPreference) => {
      updateSwapForm({ tradeProtocolPreference: newProtocolPreference })
    },
    [updateSwapForm],
  )

  const onCloseSettingsModal = useCallback(() => setShowSettingsModal(false), [])

  const isViewOnlyWallet = account?.type === AccountType.Readonly

  return (
    <>
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        mb={isWeb ? '$spacing16' : '$spacing12'}
        mt={isWeb ? '$spacing4' : '$spacing8'}
        pl={isWeb ? '$none' : '$spacing12'}
        pr={isWeb ? '$spacing4' : customSlippageTolerance ? '$spacing4' : '$spacing16'}
        testID={TestID.SwapFormHeader}
      >
        {isWeb && (
          <TouchableArea hapticFeedback testID={TestID.SwapSettings} onPress={onClose}>
            <Flex
              centered
              row
              backgroundColor={isWeb ? undefined : '$surface2'}
              borderRadius="$roundedFull"
              px="$spacing4"
              py="$spacing4"
            >
              <X color={colors.neutral2.get()} size={iconSizes.icon24} />
            </Flex>
          </TouchableArea>
        )}

        <Text variant="subheading1">{t('swap.form.header')}</Text>

        <Flex row gap="$spacing4">
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
                <Text color="$neutral2" variant="buttonLabel3">
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
                  <Text color="$neutral2" variant="buttonLabel4">
                    {t('swap.form.slippage', {
                      slippageTolerancePercent: formatPercent(customSlippageTolerance),
                    })}
                  </Text>
                ) : null}
                <Settings color={colors.neutral2.get()} size={isWeb ? iconSizes.icon20 : iconSizes.icon24} />
              </Flex>
            </TouchableArea>
          )}
        </Flex>
      </Flex>

      <SwapSettingsModal
        derivedSwapInfo={derivedSwapInfo}
        isOpen={showSwapSettingsModal}
        setCustomSlippageTolerance={setCustomSlippageTolerance}
        setTradeProtocolPreference={setTradeProtocolPreference}
        tradeProtocolPreference={tradeProtocolPreference}
        onClose={onCloseSettingsModal}
      />

      {showViewOnlyModal && <ViewOnlyModal onDismiss={(): void => setShowViewOnlyModal(false)} />}
    </>
  )
}
