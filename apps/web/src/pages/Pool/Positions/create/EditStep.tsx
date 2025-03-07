// eslint-disable-next-line no-restricted-imports
import {
  LiquidityPositionRangeChart,
  getLiquidityRangeChartProps,
} from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { getProtocolVersionLabel } from 'components/Liquidity/utils'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import {
  DEFAULT_DEPOSIT_STATE,
  useCreatePositionContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { Container, formatPrices } from 'pages/Pool/Positions/create/shared'
import { PositionFlowStep } from 'pages/Pool/Positions/create/types'
import { getInvertedTuple } from 'pages/Pool/Positions/create/utils'
import { useCallback, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { DeprecatedButton, Flex, FlexProps, Text, useMedia } from 'ui/src'
import { ArrowsLeftRight } from 'ui/src/components/icons/ArrowsLeftRight'
import { Edit } from 'ui/src/components/icons/Edit'
import { iconSizes } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

const EditStep = ({ children, onClick, ...rest }: { children: JSX.Element; onClick: () => void } & FlexProps) => {
  return (
    <Container row gap="$gap24" justifyContent="space-between" alignItems="center" {...rest}>
      {children}
      <DeprecatedButton
        theme="secondary"
        py="$spacing8"
        px="$spacing12"
        gap="$gap8"
        height={36}
        borderRadius="$rounded12"
        onPress={onClick}
        $md={{ px: '$spacing8' }}
      >
        <Edit size={iconSizes.icon20} color="$neutral1" />
        <Text variant="buttonLabel3" $md={{ display: 'none' }}>
          <Trans i18nKey="common.edit.button" />
        </Text>
      </DeprecatedButton>
    </Container>
  )
}

export const EditSelectTokensStep = (props?: FlexProps) => {
  const { setStep, derivedPositionInfo, positionState } = useCreatePositionContext()
  const { reset: resetPriceRangeState } = usePriceRangeContext()
  const { reset: resetDepositState } = useDepositContext()
  const { currencies, protocolVersion } = derivedPositionInfo
  const { fee, hook } = positionState
  const [token0, token1] = currencies
  const versionLabel = getProtocolVersionLabel(protocolVersion)
  const media = useMedia()

  const handleEdit = useCallback(() => {
    resetPriceRangeState()
    resetDepositState()
    setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  }, [resetDepositState, resetPriceRangeState, setStep])

  return (
    <EditStep onClick={handleEdit} {...props}>
      <Flex row gap="$gap12">
        <DoubleCurrencyLogo currencies={[token0, token1]} size={media.md ? iconSizes.icon44 : iconSizes.icon32} />
        <Flex row gap="$gap12" $md={{ flexDirection: 'column', gap: '$gap4' }}>
          <Flex row gap="$gap8" alignItems="center">
            <Text variant="subheading1">{token0?.symbol}</Text>
            <Text variant="subheading1">/</Text>
            <Text variant="subheading1">{token1?.symbol}</Text>
          </Flex>
          <Flex row gap={2} alignItems="center">
            <LiquidityPositionInfoBadges
              size="small"
              versionLabel={versionLabel}
              v4hook={hook}
              feeTier={fee.feeAmount}
            />
          </Flex>
        </Flex>
      </Flex>
    </EditStep>
  )
}

export const EditRangeSelectionStep = (props?: FlexProps) => {
  const {
    setStep,
    derivedPositionInfo,
    derivedPositionInfo: { currencies },
  } = useCreatePositionContext()
  const {
    priceRangeState: { priceInverted },
    derivedPriceRangeInfo,
  } = usePriceRangeContext()
  const { setDepositState } = useDepositContext()

  const { formatNumberOrString } = useLocalizationContext()
  const [baseCurrency, quoteCurrency] = getInvertedTuple(currencies, priceInverted)
  const isMobile = useIsMobile()

  const handleEdit = useCallback(() => {
    setDepositState(DEFAULT_DEPOSIT_STATE)
    setStep(PositionFlowStep.PRICE_RANGE)
  }, [setDepositState, setStep])

  const { formattedPrices, isFullRange } = useMemo(() => {
    return formatPrices(derivedPriceRangeInfo, formatNumberOrString)
  }, [formatNumberOrString, derivedPriceRangeInfo])

  const liquidityRangeChartProps = useMemo(
    () =>
      getLiquidityRangeChartProps({
        positionInfo: derivedPositionInfo,
        priceRangeInfo: derivedPriceRangeInfo,
      }),
    [derivedPositionInfo, derivedPriceRangeInfo],
  )

  return (
    <EditStep onClick={handleEdit} {...props}>
      <Flex
        grow
        flexBasis={1}
        row
        gap="$gap20"
        alignItems="center"
        justifyContent="space-between"
        $md={{ row: false, gap: 10 }}
      >
        {!!liquidityRangeChartProps && <LiquidityPositionRangeChart grow={false} {...liquidityRangeChartProps} />}
        {isMobile ? (
          <Flex row gap={10} alignItems="center" alignSelf="flex-start">
            <Text variant="body4">{`${formattedPrices[0]} ${quoteCurrency?.symbol + '/' + baseCurrency?.symbol}`}</Text>
            <ArrowsLeftRight size={iconSizes.icon16} color="$neutral2" />
            <Text variant="body4">{`${formattedPrices[1]} ${quoteCurrency?.symbol + '/' + baseCurrency?.symbol}`}</Text>
          </Flex>
        ) : !isFullRange ? (
          <Flex gap="$gap4" flex={1}>
            <Flex row gap={10}>
              <Text variant="body2" color="$neutral2">
                <Trans i18nKey="common.min" />
              </Text>
              <Text
                variant="body2"
                ellipse
              >{`${formattedPrices[0]} ${quoteCurrency?.symbol + '/' + baseCurrency?.symbol}`}</Text>
            </Flex>
            <Flex row gap={10}>
              <Text variant="body2" color="$neutral2">
                <Trans i18nKey="common.max" />
              </Text>
              <Text
                variant="body2"
                ellipse
              >{`${formattedPrices[1]} ${quoteCurrency?.symbol + '/' + baseCurrency?.symbol}`}</Text>
            </Flex>
          </Flex>
        ) : (
          <Text variant="body2" color="$neutral2">
            <Trans i18nKey="common.fullRange" />
          </Text>
        )}
      </Flex>
    </EditStep>
  )
}
