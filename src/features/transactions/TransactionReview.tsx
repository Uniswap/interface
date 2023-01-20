import { useResponsiveProp } from '@shopify/restyle'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { notificationAsync } from 'expo-haptics'
import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeInUp, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Arrow } from 'src/components/icons/Arrow'
import { AmountInput } from 'src/components/input/AmountInput'
import { RecipientPrevTransfers } from 'src/components/input/RecipientInputPanel'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { NFTTransfer } from 'src/components/NFT/NFTTransfer'
import { Text } from 'src/components/Text'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { GQLNftAsset } from 'src/features/nfts/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { dimensions, iconSizes } from 'src/styles/sizing'
import { formatNumberOrString, NumberType } from 'src/utils/format'

interface BaseReviewProps {
  actionButtonProps: { disabled: boolean; label: string; name: ElementName; onPress: () => void }
  isUSDInput?: boolean
  transactionDetails?: ReactNode
  nftIn?: GQLNftAsset
  currencyInInfo: NullUndefined<CurrencyInfo>
  currencyOutInfo?: CurrencyInfo
  formattedAmountIn?: string
  formattedAmountOut?: string
  recipient?: string
  onPrev: () => void
  inputCurrencyUSDValue?: CurrencyAmount<Currency> | null
  outputCurrencyUSDValue?: CurrencyAmount<Currency> | null
  usdTokenEquivalentAmount?: string
}

interface TransferReviewProps extends BaseReviewProps {
  recipient: string
}

interface SwapReviewProps extends BaseReviewProps {
  currencyInInfo: CurrencyInfo
  currencyOutInfo: CurrencyInfo
  formattedAmountIn: string
  formattedAmountOut: string
}

type TransactionReviewProps = TransferReviewProps | SwapReviewProps

export function TransactionReview({
  actionButtonProps,
  currencyInInfo,
  formattedAmountIn,
  currencyOutInfo,
  formattedAmountOut,
  inputCurrencyUSDValue,
  outputCurrencyUSDValue,
  nftIn,
  recipient,
  isUSDInput = false,
  transactionDetails,
  usdTokenEquivalentAmount,
  onPrev,
}: TransactionReviewProps): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()

  const { trigger: actionButtonTrigger } = useBiometricPrompt(actionButtonProps.onPress)
  const { requiredForTransactions } = useBiometricAppSettings()

  const spacingGap = { xs: 'none', sm: 'sm' }
  const innerGap = useResponsiveProp({ xs: 'none', sm: 'md' })

  const fontFamily = useResponsiveProp({
    xs: theme.textVariants.headlineSmall.fontFamily,
    sm: theme.textVariants.headlineLarge.fontFamily,
  })

  const fontSize = useResponsiveProp({
    xs: theme.textVariants.headlineSmall.fontSize,
    sm: theme.textVariants.headlineLarge.fontSize,
  })

  const lineHeight = useResponsiveProp({
    xs: theme.textVariants.headlineSmall.lineHeight,
    sm: theme.textVariants.headlineLarge.lineHeight,
  })

  const maxFontSizeMultiplier = useResponsiveProp({
    xs: theme.textVariants.headlineSmall.maxFontSizeMultiplier,
    sm: theme.textVariants.headlineLarge.maxFontSizeMultiplier,
  })

  const equivalentValueTextVariant = useResponsiveProp({
    xs: 'bodySmall',
    sm: 'subheadLarge',
  })

  const arrowPadding = useResponsiveProp({ xs: 'xxs', sm: 'xs' })

  const amountAndEquivalentValueGap = useResponsiveProp({ xs: 'xxs', sm: 'none' })

  const formattedInputUsdValue = inputCurrencyUSDValue
    ? formatNumberOrString(inputCurrencyUSDValue?.toExact(), NumberType.FiatTokenQuantity)
    : ''
  const formattedOutputUsdValue = outputCurrencyUSDValue
    ? formatNumberOrString(outputCurrencyUSDValue?.toExact(), NumberType.FiatTokenQuantity)
    : ''

  return (
    <>
      <AnimatedFlex centered grow entering={FadeInUp} exiting={FadeOut} gap={spacingGap}>
        {currencyInInfo ? (
          <Flex centered gap={innerGap}>
            <Flex centered gap={amountAndEquivalentValueGap}>
              <AmountInput
                alignSelf="stretch"
                backgroundColor="none"
                borderWidth={0}
                editable={false}
                fontFamily={fontFamily}
                fontSize={fontSize}
                height={lineHeight}
                maxFontSizeMultiplier={maxFontSizeMultiplier}
                my="none"
                px="md"
                py="none"
                // on review screen, number formatter will already include $ sign
                showCurrencySign={false}
                showSoftInputOnFocus={false}
                testID="amount-input-in"
                textAlign="center"
                value={formattedAmountIn}
              />
              {inputCurrencyUSDValue && !isUSDInput ? (
                <Text color="textSecondary" variant={equivalentValueTextVariant}>
                  {formattedInputUsdValue}
                </Text>
              ) : null}
              {isUSDInput ? (
                <Text color="textSecondary" variant={equivalentValueTextVariant}>
                  {/* when sending a token with USD input, show the amount of the token being sent */}
                  {usdTokenEquivalentAmount}
                </Text>
              ) : null}
            </Flex>
            <CurrencyLogoWithLabel currencyInfo={currencyInInfo} />
          </Flex>
        ) : nftIn ? (
          <Flex mt="xxxl">
            <NFTTransfer asset={nftIn} nftSize={dimensions.fullHeight / 5} />
          </Flex>
        ) : null}
        <TransferArrowButton disabled bg="none" borderColor="none" padding={arrowPadding} />
        {currencyOutInfo && formattedAmountOut ? (
          <Flex centered gap={innerGap} pb={{ xs: 'xxs', sm: 'none' }}>
            <Flex centered gap={amountAndEquivalentValueGap}>
              <AmountInput
                alignSelf="stretch"
                backgroundColor="none"
                borderWidth={0}
                editable={false}
                fontFamily={fontFamily}
                fontSize={fontSize}
                height={lineHeight}
                maxFontSizeMultiplier={maxFontSizeMultiplier}
                showCurrencySign={isUSDInput}
                showSoftInputOnFocus={false}
                testID="amount-input-out"
                textAlign="center"
                value={formattedAmountOut}
              />
              {outputCurrencyUSDValue ? (
                <Text color="textSecondary" variant={equivalentValueTextVariant}>
                  {formattedOutputUsdValue}
                </Text>
              ) : null}
            </Flex>
            <CurrencyLogoWithLabel currencyInfo={currencyOutInfo} />
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
            CustomIcon={
              <Arrow color={theme.colors.textPrimary} direction="w" size={theme.iconSizes.lg} />
            }
            emphasis={ButtonEmphasis.Tertiary}
            size={ButtonSize.Large}
            onPress={onPrev}
          />
          <Button
            fill
            disabled={actionButtonProps.disabled}
            label={actionButtonProps.label}
            name={actionButtonProps.name}
            size={ButtonSize.Large}
            onPress={(): void => {
              notificationAsync()
              if (requiredForTransactions) {
                actionButtonTrigger()
              } else {
                actionButtonProps.onPress()
              }
            }}
          />
        </Flex>
      </AnimatedFlex>
    </>
  )
}

function CurrencyLogoWithLabel({ currencyInfo }: { currencyInfo: CurrencyInfo }): JSX.Element {
  const gap = useResponsiveProp({ xs: 'xxs', sm: 'xs' })
  const size = useResponsiveProp({ xs: iconSizes.md, sm: iconSizes.xl })
  return (
    <Flex centered row gap={gap}>
      <CurrencyLogo currencyInfo={currencyInfo} size={size} />
      <Text color="textPrimary" variant="buttonLabelLarge">
        {currencyInfo.currency.symbol}
      </Text>
    </Flex>
  )
}
