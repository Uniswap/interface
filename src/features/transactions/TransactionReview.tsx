import { Currency } from '@uniswap/sdk-core'
import { notificationAsync } from 'expo-haptics'
import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeInUp, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { GradientButton } from 'src/components/buttons/GradientButton'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Arrow } from 'src/components/icons/Arrow'
import { AmountInput } from 'src/components/input/AmountInput'
import { RecipientPrevTransfers } from 'src/components/input/RecipientInputPanel'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { NFTTransfer } from 'src/components/NFT/NFTTransfer'
import { Text } from 'src/components/Text'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { NFTAsset } from 'src/features/nfts/types'
import { dimensions } from 'src/styles/sizing'
import { formatNumber, NumberType } from 'src/utils/format'

interface BaseReviewProps {
  actionButtonProps: { disabled: boolean; label: string; name: string; onPress: () => void }
  isUSDInput: boolean
  transactionDetails?: ReactNode
  nftIn?: NFTAsset.Asset
  currencyIn?: Currency
  currencyOut?: Currency
  formattedAmountIn?: string
  formattedAmountOut?: string
  recipient?: string
  onPrev: () => void
}

interface TransferReviewProps extends BaseReviewProps {
  recipient: string
}

interface SwapReviewProps extends BaseReviewProps {
  currencyIn: Currency
  currencyOut: Currency
  formattedAmountIn: string
  formattedAmountOut: string
}

type TransactionReviewProps = TransferReviewProps | SwapReviewProps

export function TransactionReview({
  actionButtonProps,
  currencyIn,
  formattedAmountIn,
  currencyOut,
  formattedAmountOut,
  nftIn,
  recipient,
  isUSDInput,
  transactionDetails,
  onPrev,
}: TransactionReviewProps) {
  const theme = useAppTheme()
  const { t } = useTranslation()

  const { trigger: actionButtonTrigger } = useBiometricPrompt(actionButtonProps.onPress)
  const { requiredForTransactions } = useBiometricAppSettings()

  return (
    <>
      <AnimatedFlex centered grow entering={FadeInUp} exiting={FadeOut} gap="sm">
        {currencyIn ? (
          <Flex centered gap="sm">
            <AmountInput
              alignSelf="stretch"
              backgroundColor="none"
              borderWidth={0}
              editable={false}
              fontFamily={theme.textVariants.headlineLarge.fontFamily}
              fontSize={theme.textVariants.headlineLarge.fontSize}
              height={theme.textVariants.headlineLarge.lineHeight}
              maxFontSizeMultiplier={theme.textVariants.headlineLarge.maxFontSizeMultiplier}
              px="md"
              py="none"
              showCurrencySign={isUSDInput}
              showSoftInputOnFocus={false}
              testID="amount-input-in"
              textAlign="center"
              value={
                formattedAmountIn
                  ? formatNumber(parseFloat(formattedAmountIn), NumberType.TokenTx)
                  : undefined
              }
            />
            <CurrencyLogoWithLabel currency={currencyIn} />
          </Flex>
        ) : nftIn ? (
          <Flex mt="xxxl">
            <NFTTransfer asset={nftIn} nftSize={dimensions.fullHeight / 5} />
          </Flex>
        ) : null}
        <TransferArrowButton disabled bg="none" borderColor="none" />
        {currencyOut && formattedAmountOut ? (
          <Flex centered gap="md">
            <Flex gap="sm">
              <AmountInput
                alignSelf="stretch"
                backgroundColor="none"
                borderWidth={0}
                editable={false}
                fontFamily={theme.textVariants.headlineLarge.fontFamily}
                fontSize={theme.textVariants.headlineLarge.fontSize}
                height={theme.textVariants.headlineLarge.lineHeight}
                maxFontSizeMultiplier={theme.textVariants.headlineLarge.maxFontSizeMultiplier}
                showCurrencySign={isUSDInput}
                showSoftInputOnFocus={false}
                testID="amount-input-out"
                textAlign="center"
                value={formatNumber(parseFloat(formattedAmountOut), NumberType.TokenTx)}
              />
              <CurrencyLogoWithLabel currency={currencyOut} />
            </Flex>
          </Flex>
        ) : recipient ? (
          <Flex centered gap="sm">
            <Text color="textTertiary" variant="bodyLarge">
              {t('To')}
            </Text>
            <Flex centered gap="xs">
              <AddressDisplay
                hideAddressInSubtitle
                address={recipient}
                size={24}
                variant="headlineMedium"
              />
              <RecipientPrevTransfers recipient={recipient} />
            </Flex>
          </Flex>
        ) : null}
      </AnimatedFlex>
      <AnimatedFlex
        entering={FadeInUp}
        exiting={FadeOut}
        flexGrow={0}
        gap="sm"
        justifyContent="flex-end">
        {transactionDetails}
        <Flex row gap="xs">
          <Button
            CustomIcon={<Arrow color={theme.colors.textPrimary} direction="w" size={20} />}
            emphasis={ButtonEmphasis.Tertiary}
            size={ButtonSize.Large}
            onPress={onPrev}
          />
          <Flex grow>
            <GradientButton
              disabled={actionButtonProps.disabled}
              label={actionButtonProps.label}
              name={actionButtonProps.name}
              textVariant="buttonLabelLarge"
              onPress={() => {
                notificationAsync()
                if (requiredForTransactions) {
                  actionButtonTrigger()
                } else {
                  actionButtonProps.onPress()
                }
              }}
            />
          </Flex>
        </Flex>
      </AnimatedFlex>
    </>
  )
}

function CurrencyLogoWithLabel({ currency }: { currency: Currency }) {
  return (
    <Flex centered row gap="xs">
      <CurrencyLogo currency={currency} size={28} />
      <Text color="textPrimary" variant="buttonLabelLarge">
        {currency.symbol}
      </Text>
    </Flex>
  )
}
