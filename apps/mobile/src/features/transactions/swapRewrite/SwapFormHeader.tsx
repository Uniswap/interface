import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { SwapSettingsModal } from 'src/features/transactions/swap/modals/SwapSettingsModal'
import {
  SwapScreen,
  useSwapScreenContext,
} from 'src/features/transactions/swapRewrite/contexts/SwapScreenContext'
import { Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import SettingsIcon from 'ui/src/assets/icons/settings.svg'
import { iconSizes } from 'ui/src/theme'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { useSwapFormContext } from './contexts/SwapFormContext'

export function SwapFormHeader(): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const colors = useSporeColors()
  const account = useActiveAccountWithThrow()

  const { screen } = useSwapScreenContext()

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
        mt="$spacing8"
        pb="$spacing12"
        pl="$spacing12"
        pr={customSlippageTolerance ? '$spacing8' : '$spacing16'}>
        <Text $sm={{ variant: 'subheading1' }} $xs={{ variant: 'subheading2' }}>
          {t('Swap')}
        </Text>

        <Flex row gap="$spacing4">
          {isViewOnlyWallet && (
            <TouchableArea
              bg="$surface2"
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
                  {t('View-only')}
                </Text>
              </Flex>
            </TouchableArea>
          )}

          {screen === SwapScreen.SwapForm && !isViewOnlyWallet && (
            <TouchableArea
              hapticFeedback
              testID={ElementName.SwapSettings}
              onPress={onPressSwapSettings}>
              <Flex
                centered
                row
                bg={customSlippageTolerance ? '$surface2' : '$transparent'}
                borderRadius="$roundedFull"
                gap="$spacing4"
                px={customSlippageTolerance ? '$spacing8' : '$none'}
                py="$spacing4">
                {customSlippageTolerance ? (
                  <Text color="$neutral2" variant="buttonLabel4">
                    {t('{{slippageTolerancePercent}} slippage', {
                      slippageTolerancePercent: formatPercent(customSlippageTolerance),
                    })}
                  </Text>
                ) : null}
                <SettingsIcon
                  color={colors.neutral2.get()}
                  height={iconSizes.icon28}
                  width={iconSizes.icon28}
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
      caption={t('You need to import this wallet via recovery phrase to swap tokens.')}
      confirmText={t('Dismiss')}
      icon={<Icons.Eye color="$neutral2" size={iconSizes.icon24} />}
      modalName={ModalName.SwapWarning}
      severity={WarningSeverity.Low}
      title={t('This wallet is view-only')}
      onClose={onDismiss}
      onConfirm={onDismiss}
    />
  )
}
