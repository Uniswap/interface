import React, { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { ElementName } from 'src/features/telemetry/constants'
import { useTokenFormActionHandlers } from 'src/features/transactions/hooks'
import { TransactionFlowProps, TransactionStep } from 'src/features/transactions/TransactionFlow'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import DollarSign from 'ui/src/assets/icons/dollar.svg'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import SettingsIcon from 'ui/src/assets/icons/settings.svg'
import { iconSizes } from 'ui/src/theme'
import { formatPercent } from 'utilities/src/format/format'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

type HeaderContentProps = Pick<
  TransactionFlowProps,
  'dispatch' | 'flowName' | 'step' | 'showUSDToggle' | 'isUSDInput'
> & {
  isSwap: boolean
  customSlippageTolerance: number | undefined
  setShowViewOnlyModal: Dispatch<SetStateAction<boolean>>
  setShowSettingsModal: Dispatch<SetStateAction<boolean>>
}

export function HeaderContent({
  dispatch,
  isSwap,
  customSlippageTolerance,
  flowName,
  step,
  showUSDToggle,
  isUSDInput,
  setShowSettingsModal,
  setShowViewOnlyModal,
}: HeaderContentProps): JSX.Element {
  const colors = useSporeColors()
  const account = useActiveAccountWithThrow()
  const { t } = useTranslation()
  const { onToggleUSDInput } = useTokenFormActionHandlers(dispatch)

  const onPressSwapSettings = (): void => {
    setShowSettingsModal(true)
    Keyboard.dismiss()
  }

  const isViewOnlyWallet = account?.type === AccountType.Readonly

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      mt="$spacing8"
      pb="$spacing8"
      pl="$spacing12"
      pr={customSlippageTolerance ? '$spacing8' : '$spacing16'}>
      <Text $short={{ variant: 'subheading2' }} $sm={{ variant: 'subheading1' }}>
        {flowName}
      </Text>
      <Flex row gap="$spacing4">
        {step === TransactionStep.FORM && showUSDToggle ? (
          <TouchableArea
            hapticFeedback
            bg={isUSDInput ? '$accent2' : '$surface2'}
            borderRadius="$rounded16"
            px="$spacing8"
            py="$spacing4"
            onPress={(): void => onToggleUSDInput(!isUSDInput)}>
            <Flex row alignItems="center" gap="$spacing4">
              <DollarSign
                color={isUSDInput ? colors.accent1.get() : colors.neutral2.get()}
                height={iconSizes.icon16}
                width={iconSizes.icon16}
              />
              <Text color={isUSDInput ? '$accent1' : '$neutral2'} variant="buttonLabel3">
                {t('USD')}
              </Text>
            </Flex>
          </TouchableArea>
        ) : null}
        {isViewOnlyWallet ? (
          <TouchableArea
            bg="$surface2"
            borderRadius="$rounded12"
            justifyContent="center"
            px="$spacing8"
            py="$spacing4"
            onPress={(): void => setShowViewOnlyModal(true)}>
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
        ) : null}
        {step === TransactionStep.FORM && isSwap && !isViewOnlyWallet ? (
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
                  {`${formatPercent(customSlippageTolerance)} ${t('slippage')}`}
                </Text>
              ) : null}
              <SettingsIcon
                color={colors.neutral3.get()}
                height={iconSizes.icon28}
                width={iconSizes.icon28}
              />
            </Flex>
          </TouchableArea>
        ) : null}
      </Flex>
    </Flex>
  )
}
