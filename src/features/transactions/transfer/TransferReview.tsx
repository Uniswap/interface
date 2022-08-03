import { AnyAction } from '@reduxjs/toolkit'
import { FixedNumber } from 'ethers'
import { notificationAsync } from 'expo-haptics'
import React, { Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeInUp, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Arrow } from 'src/components/icons/Arrow'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { AmountInput } from 'src/components/input/AmountInput'
import { RecipientPrevTransfers } from 'src/components/input/RecipientInputPanel'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { WarningAction } from 'src/components/warnings/types'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import {
  DerivedTransferInfo,
  useTransferERC20Callback,
  useTransferNFTCallback,
  useUpdateTransferGasEstimate,
} from 'src/features/transactions/transfer/hooks'
import { TransferDetails } from 'src/features/transactions/transfer/TransferDetails'
import { InputAssetInfo } from 'src/features/transactions/transfer/types'
import { TransactionType } from 'src/features/transactions/types'
import { dimensions } from 'src/styles/sizing'
import { currencyAddress } from 'src/utils/currencyId'
import { fixedNumberToInt } from 'src/utils/number'

interface TransferFormProps {
  state: TransactionState
  derivedTransferInfo: DerivedTransferInfo
  inputAssetInfo: InputAssetInfo
  dispatch: Dispatch<AnyAction>
  onNext: () => void
  onPrev: () => void
}

export function TransferReview({
  derivedTransferInfo,
  inputAssetInfo,
  state,
  dispatch,
  onNext,
  onPrev,
}: TransferFormProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const {
    currencyAmounts,
    currencyTypes,
    formattedAmounts,
    recipient,
    isUSDInput = false,
    warnings,
  } = derivedTransferInfo
  const { isNFT, currencyIn, nftIn, chainId } = inputAssetInfo
  const { gasSpendEstimate, gasPrice } = state

  // TODO: how should we surface this warning?
  const actionButtonDisabled = warnings.some(
    (warning) => warning.action === WarningAction.DisableReview
  )

  // if action button is disabled, make amount undefined so that gas estimate doesn't run
  useUpdateTransferGasEstimate(
    dispatch,
    chainId,
    isNFT ? nftIn?.asset_contract.address : currencyIn ? currencyAddress(currencyIn) : undefined,
    !actionButtonDisabled ? currencyAmounts[CurrencyField.INPUT]?.quotient.toString() : undefined,
    recipient,
    nftIn?.token_id,
    currencyTypes[CurrencyField.INPUT]
  )

  const gasFee =
    gasSpendEstimate && gasPrice
      ? fixedNumberToInt(
          FixedNumber.from(gasSpendEstimate[TransactionType.Send]).mulUnsafe(
            FixedNumber.from(gasPrice)
          )
        )
      : undefined

  const transferERC20Callback = useTransferERC20Callback(
    chainId,
    recipient,
    currencyIn ? currencyAddress(currencyIn) : undefined,
    currencyAmounts[CurrencyField.INPUT]?.quotient.toString(),
    onNext
  )
  // TODO: if readonly account, not sendable
  const transferNFTCallback = useTransferNFTCallback(
    chainId,
    recipient,
    nftIn?.asset_contract.address,
    nftIn?.token_id,
    onNext
  )

  const submitCallback = () => {
    onNext()
    isNFT ? transferNFTCallback?.() : transferERC20Callback?.()
  }
  const { trigger: actionButtonTrigger, modal: BiometricModal } = useBiometricPrompt(submitCallback)
  const { requiredForTransactions } = useBiometricAppSettings()

  const onSubmit = () => {
    notificationAsync()
    if (requiredForTransactions) {
      actionButtonTrigger()
    } else {
      submitCallback()
    }
  }

  if (!recipient) return null

  return (
    <>
      <AnimatedFlex centered entering={FadeInUp} exiting={FadeOut} flexGrow={1} gap="xs">
        <Text color="textSecondary" variant="bodySmall">
          {t('Send')}
        </Text>
        {/* TODO: onPressIn here should go back to prev screen */}
        {!isNFT && currencyIn && (
          <AmountInput
            alignSelf="stretch"
            borderWidth={0}
            editable={false}
            fontFamily={theme.textVariants.headlineLarge.fontFamily}
            fontSize={48}
            height={48}
            mb="xs"
            placeholder="0"
            px="none"
            py="none"
            showCurrencySign={isUSDInput}
            showSoftInputOnFocus={false}
            testID="amount-input-in"
            textAlign="center"
            value={formattedAmounts[CurrencyField.INPUT]}
          />
        )}
        <Flex centered gap="none">
          {!isNFT && currencyIn && (
            <Flex centered row gap="xs">
              <CurrencyLogo currency={currencyIn} size={28} />
              <Text color="textPrimary" variant="largeLabel">
                {currencyIn.symbol}
              </Text>
            </Flex>
          )}

          {isNFT && (
            <Flex
              centered
              maxHeight={dimensions.fullHeight * 0.35}
              maxWidth={dimensions.fullWidth}
              mx="xl">
              {nftIn && <NFTViewer uri={nftIn.image_url} />}
            </Flex>
          )}
          <TransferArrowButton disabled borderColor="none" />
        </Flex>
        <Text color="textSecondary" variant="bodySmall">
          {t('To')}
        </Text>
        <Flex centered gap="xs">
          <AddressDisplay address={recipient} size={24} variant="headlineMedium" />
          <RecipientPrevTransfers recipient={recipient} />
        </Flex>
      </AnimatedFlex>
      <Flex flexGrow={1} gap="sm" justifyContent="flex-end" mb="xl" mt="xs" px="sm">
        <TransferDetails chainId={chainId} gasFee={gasFee} />
        <Flex row gap="xs">
          <Button
            alignItems="center"
            borderColor="backgroundOutline"
            borderRadius="lg"
            borderWidth={1}
            flexDirection="row"
            justifyContent="center"
            px="md"
            py="sm"
            onPress={onPrev}>
            <Arrow color={theme.colors.textSecondary} direction="w" size={20} />
          </Button>
          <Flex grow>
            <Button
              disabled={actionButtonDisabled}
              name={ElementName.Send}
              opacity={actionButtonDisabled ? 0.5 : 1}
              onPress={onSubmit}>
              <Box
                alignItems="center"
                backgroundColor="accentAction"
                borderRadius="lg"
                overflow="hidden"
                py="md">
                <Text color="white" variant="largeLabel">
                  {t('Send')}
                </Text>
              </Box>
              {BiometricModal}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
