import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { notificationAsync } from 'expo-haptics'
import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeInUp, FadeOut } from 'react-native-reanimated'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { Arrow } from 'src/components/icons/Arrow'
import { AmountInput } from 'src/components/input/AmountInput'
import { RecipientPrevTransfers } from 'src/components/input/RecipientInputPanel'
import { NFTTransfer } from 'src/components/NFT/NFTTransfer'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { GQLNftAsset } from 'src/features/nfts/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { AnimatedFlex, Button, Flex, Text, useMedia, useSporeColors } from 'ui/src'
import { dimensions, fonts, iconSizes } from 'ui/src/theme'
import { formatNumberOrString, NumberType } from 'utilities/src/format/format'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

interface BaseReviewProps {
  actionButtonProps: { disabled: boolean; label: string; name: ElementName; onPress: () => void }
  isUSDInput?: boolean
  transactionDetails?: ReactNode
  nftIn?: GQLNftAsset
  currencyInInfo: Maybe<CurrencyInfo>
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
  const colors = useSporeColors()
  const media = useMedia()
  const { t } = useTranslation()

  const { trigger: actionButtonTrigger } = useBiometricPrompt(actionButtonProps.onPress)
  const { requiredForTransactions } = useBiometricAppSettings()

  const textProps = media.short
    ? {
        fontFamily: fonts.heading3.family,
        fontSize: fonts.heading3.fontSize,
        lineHeight: fonts.heading3.lineHeight,
        maxFontSizeMultiplier: fonts.body2.maxFontSizeMultiplier,
      }
    : {
        fontFamily: fonts.heading2.family,
        fontSize: fonts.heading2.fontSize,
        lineHeight: fonts.heading3.lineHeight,
        maxFontSizeMultiplier: fonts.heading2.maxFontSizeMultiplier,
      }

  const equivalentValueTextVariant = media.short ? 'body2' : 'body1'

  const innerGap = media.short ? '$none' : '$spacing12'
  const arrowPadding = media.short ? '$spacing4' : '$spacing8'
  const amountAndEquivalentValueGap = media.short ? '$spacing4' : '$spacing4'

  const formattedInputUsdValue = inputCurrencyUSDValue
    ? formatNumberOrString(inputCurrencyUSDValue?.toExact(), NumberType.FiatTokenQuantity)
    : ''
  const formattedOutputUsdValue = outputCurrencyUSDValue
    ? formatNumberOrString(outputCurrencyUSDValue?.toExact(), NumberType.FiatTokenQuantity)
    : ''

  return (
    <>
      <AnimatedFlex
        centered
        grow
        $short={{ gap: '$none' }}
        entering={FadeInUp}
        exiting={FadeOut}
        gap="$spacing4">
        {currencyInInfo ? (
          <Flex centered gap={innerGap}>
            <Flex centered gap={amountAndEquivalentValueGap}>
              {recipient && (
                <Text color="$neutral2" variant="body1">
                  {t('Sending')}
                </Text>
              )}
              <AmountInput
                {...textProps}
                alignSelf="stretch"
                backgroundColor="none"
                borderWidth={0}
                editable={false}
                my="none"
                px="spacing16"
                py="none"
                // on review screen, number formatter will already include $ sign
                showCurrencySign={false}
                showSoftInputOnFocus={false}
                testID="amount-input-in"
                textAlign="center"
                value={formattedAmountIn}
              />
              {recipient && inputCurrencyUSDValue && !isUSDInput ? (
                <Text color="$neutral2" variant={equivalentValueTextVariant}>
                  {formattedInputUsdValue}
                </Text>
              ) : null}
              {isUSDInput ? (
                <Text color="$neutral2" variant={equivalentValueTextVariant}>
                  {/* when sending a token with USD input, show the amount of the token being sent */}
                  {usdTokenEquivalentAmount}
                </Text>
              ) : null}
              <CurrencyLogoWithLabel currencyInfo={currencyInInfo} />
            </Flex>
          </Flex>
        ) : nftIn ? (
          <Flex mt="$spacing60">
            <NFTTransfer asset={nftIn} nftSize={dimensions.fullHeight / 5} />
          </Flex>
        ) : null}
        <TransferArrowButton
          disabled
          bg="$transparent"
          borderColor="$transparent"
          padding={arrowPadding}
        />
        {currencyOutInfo && formattedAmountOut ? (
          <Flex centered $short={{ pb: '$spacing4' }} gap={innerGap} pb="$none">
            <Flex centered gap={amountAndEquivalentValueGap}>
              <Flex height={textProps.lineHeight} justifyContent="center" overflow="hidden">
                <AmountInput
                  {...textProps}
                  alignSelf="stretch"
                  backgroundColor="none"
                  borderWidth={0}
                  editable={false}
                  showCurrencySign={isUSDInput}
                  showSoftInputOnFocus={false}
                  testID="amount-input-out"
                  textAlign="center"
                  value={formattedAmountOut}
                />
              </Flex>
              {outputCurrencyUSDValue ? (
                <Text color="$neutral2" variant={equivalentValueTextVariant}>
                  {formattedOutputUsdValue}
                </Text>
              ) : null}
            </Flex>
            <CurrencyLogoWithLabel currencyInfo={currencyOutInfo} />
          </Flex>
        ) : recipient ? (
          <Flex centered gap="$spacing12">
            <Text color="$neutral2" variant="body1">
              {t('To')}
            </Text>
            <Flex centered gap="$spacing8">
              <AddressDisplay
                hideAddressInSubtitle
                address={recipient}
                size={24}
                variant="heading2"
              />
              <RecipientPrevTransfers recipient={recipient} />
            </Flex>
          </Flex>
        ) : null}
      </AnimatedFlex>
      <AnimatedFlex
        entering={FadeInUp}
        exiting={FadeOut}
        gap="$spacing12"
        justifyContent="flex-end">
        {transactionDetails}
        <Flex row gap="$spacing8">
          <Button
            icon={<Arrow color={colors.neutral1.get()} direction="w" size={iconSizes.icon24} />}
            size="large"
            theme="tertiary"
            onPress={onPrev}
          />
          <Button
            fill
            disabled={actionButtonProps.disabled}
            size="large"
            testID={actionButtonProps.name}
            onPress={async (): Promise<void> => {
              await notificationAsync()
              if (requiredForTransactions) {
                await actionButtonTrigger()
              } else {
                actionButtonProps.onPress()
              }
            }}>
            {actionButtonProps.label}
          </Button>
        </Flex>
      </AnimatedFlex>
    </>
  )
}

function CurrencyLogoWithLabel({ currencyInfo }: { currencyInfo: CurrencyInfo }): JSX.Element {
  const media = useMedia()
  const size = media.short ? iconSizes.icon20 : iconSizes.icon24

  return (
    <Flex centered row $short={{ gap: '$spacing4' }} gap="$spacing8">
      <CurrencyLogo currencyInfo={currencyInfo} size={size} />
      <Text color="$neutral1" variant="buttonLabel1">
        {getSymbolDisplayText(currencyInfo.currency.symbol)}
      </Text>
    </Flex>
  )
}
