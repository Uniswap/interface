import React, { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { iconSizes } from 'ui/src/theme'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { useTokenFormActionHandlers } from 'wallet/src/features/transactions/hooks/useTokenFormActionHandlers'
import { TransactionStep, TransferFlowProps } from 'wallet/src/features/transactions/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

type HeaderContentProps = Pick<
  TransferFlowProps,
  'dispatch' | 'flowName' | 'step' | 'showFiatToggle' | 'isFiatInput'
> & {
  setShowViewOnlyModal: Dispatch<SetStateAction<boolean>>
}

export function TransferHeader({
  dispatch,
  flowName,
  step,
  showFiatToggle,
  isFiatInput,
  setShowViewOnlyModal,
}: HeaderContentProps): JSX.Element {
  const colors = useSporeColors()
  const account = useActiveAccountWithThrow()
  const { t } = useTranslation()
  const { onToggleFiatInput } = useTokenFormActionHandlers(dispatch)
  const currency = useAppFiatCurrencyInfo()

  const isViewOnlyWallet = account?.type === AccountType.Readonly

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      mt="$spacing8"
      pb="$spacing8"
      pl="$spacing12"
      pr="$spacing16">
      <Text $short={{ variant: 'subheading2' }} $sm={{ variant: 'subheading1' }}>
        {flowName}
      </Text>
      <Flex row gap="$spacing4">
        {step === TransactionStep.FORM && showFiatToggle ? (
          <TouchableArea
            hapticFeedback
            backgroundColor={isFiatInput ? '$accent2' : '$surface2'}
            borderRadius="$rounded16"
            px="$spacing8"
            py="$spacing4"
            onPress={(): void => onToggleFiatInput(!isFiatInput)}>
            <Flex row alignItems="center" gap="$spacing4">
              <Text color={isFiatInput ? '$accent1' : '$neutral2'} variant="buttonLabel3">
                {currency.symbol}
              </Text>
              <Text color={isFiatInput ? '$accent1' : '$neutral2'} variant="buttonLabel3">
                {currency.code}
              </Text>
            </Flex>
          </TouchableArea>
        ) : null}
        {isViewOnlyWallet ? (
          <TouchableArea
            backgroundColor="$surface2"
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
                {t('swap.header.viewOnly')}
              </Text>
            </Flex>
          </TouchableArea>
        ) : null}
      </Flex>
    </Flex>
  )
}
