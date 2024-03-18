import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { Flex, Icons, isWeb, Text, TouchableArea, useSporeColors } from 'ui/src'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import SettingsIcon from 'ui/src/assets/icons/settings.svg'
import XIcon from 'ui/src/assets/icons/x.svg'
import { iconSizes } from 'ui/src/theme'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { useTransactionModalContext } from 'wallet/src/features/transactions/contexts/TransactionModalContext'
import { SwapSettingsModal } from 'wallet/src/features/transactions/swap/modals/settings/SwapSettingsModal'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'

export function SwapFormHeader(): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const colors = useSporeColors()
  const account = useActiveAccountWithThrow()

  const { onClose } = useTransactionModalContext()
  const { updateSwapForm, customSlippageTolerance, derivedSwapInfo } = useSwapFormContext()

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
    [updateSwapForm]
  )

  const onCloseSettingsModal = useCallback(() => setShowSettingsModal(false), [])

  const isViewOnlyWallet = account?.type === AccountType.Readonly

  return (
    <>
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        mb={isWeb ? '$spacing24' : '$spacing12'}
        mt={isWeb ? '$spacing4' : '$spacing8'}
        pl={isWeb ? '$spacing4' : '$spacing12'}
        pr={isWeb ? '$spacing4' : customSlippageTolerance ? '$spacing8' : '$spacing16'}
        testID={ElementName.SwapFormHeader}>
        {isWeb && (
          <TouchableArea hapticFeedback testID={ElementName.SwapSettings} onPress={onClose}>
            <Flex
              centered
              row
              backgroundColor="$surface2"
              borderRadius="$roundedFull"
              px="$spacing4"
              py="$spacing4">
              <XIcon
                color={colors.neutral2.get()}
                height={iconSizes.icon24}
                width={iconSizes.icon24}
              />
            </Flex>
          </TouchableArea>
        )}

        <Text $sm={{ variant: 'subheading1' }} $xs={{ variant: 'subheading2' }}>
          {t('swap.form.header')}
        </Text>

        <Flex row gap="$spacing4">
          {isViewOnlyWallet && (
            <TouchableArea
              backgroundColor="$surface2"
              borderRadius="$rounded12"
              justifyContent="center"
              px="$spacing8"
              py="$spacing4"
              onPress={onPressViewOnlyModal}>
              <Flex row alignItems="center" gap="$spacing4">
                <EyeIcon
                  color={colors.neutral2.get()}
                  height={iconSizes.icon16}
                  width={iconSizes.icon16}
                />
                <Text color="$neutral2" variant="buttonLabel3">
                  {t('swap.header.viewOnly')}
                </Text>
              </Flex>
            </TouchableArea>
          )}

          {!isViewOnlyWallet && (
            <TouchableArea
              hapticFeedback
              testID={ElementName.SwapSettings}
              onPress={onPressSwapSettings}>
              <Flex
                centered
                row
                backgroundColor={customSlippageTolerance || isWeb ? '$surface2' : '$transparent'}
                borderRadius="$roundedFull"
                gap="$spacing4"
                px={customSlippageTolerance ? '$spacing8' : '$spacing4'}
                py="$spacing4">
                {customSlippageTolerance ? (
                  <Text color="$neutral2" variant="buttonLabel4">
                    {t('swap.form.slippage', {
                      slippageTolerancePercent: formatPercent(customSlippageTolerance),
                    })}
                  </Text>
                ) : null}
                <SettingsIcon
                  color={colors.neutral2.get()}
                  height={isWeb ? iconSizes.icon24 : iconSizes.icon28}
                  width={isWeb ? iconSizes.icon24 : iconSizes.icon28}
                />
              </Flex>
            </TouchableArea>
          )}
        </Flex>
      </Flex>

      {showSwapSettingsModal && (
        <SwapSettingsModal
          derivedSwapInfo={derivedSwapInfo}
          setCustomSlippageTolerance={setCustomSlippageTolerance}
          onClose={onCloseSettingsModal}
        />
      )}
      {showViewOnlyModal && <ViewOnlyModal onDismiss={(): void => setShowViewOnlyModal(false)} />}
    </>
  )
}

const ViewOnlyModal = ({ onDismiss }: { onDismiss: () => void }): JSX.Element => {
  const { t } = useTranslation()
  return (
    <WarningModal
      caption={t('swap.warning.viewOnly.message')}
      confirmText={t('common.button.dismiss')}
      icon={<Icons.Eye color="$neutral2" size={iconSizes.icon24} />}
      modalName={ModalName.SwapWarning}
      severity={WarningSeverity.Low}
      title={t('account.wallet.viewOnly.title')}
      onClose={onDismiss}
      onConfirm={onDismiss}
    />
  )
}
