// eslint-disable-next-line no-restricted-imports
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { getProtocolVersionLabel } from 'components/Liquidity/utils'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import {
  DEFAULT_DEPOSIT_STATE,
  DEFAULT_PRICE_RANGE_STATE,
  useCreatePositionContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { Container, formatPrices } from 'pages/Pool/Positions/create/shared'
import { PositionFlowStep } from 'pages/Pool/Positions/create/types'
import { getInvertedTuple } from 'pages/Pool/Positions/create/utils'
import { useCallback, useMemo } from 'react'
import { Button, Flex, FlexProps, Text } from 'ui/src'
import { Edit } from 'ui/src/components/icons/Edit'
import { iconSizes } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Trans } from 'uniswap/src/i18n'

const EditStep = ({ children, onClick, ...rest }: { children: JSX.Element; onClick: () => void } & FlexProps) => {
  return (
    <Container
      row
      justifyContent="space-between"
      alignItems="center"
      $md={{ row: false, alignItems: 'flex-start', justifyContent: 'flex-start' }}
      {...rest}
    >
      {children}
      <Button
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
      </Button>
    </Container>
  )
}

export const EditSelectTokensStep = (props?: FlexProps) => {
  const { setStep, derivedPositionInfo, positionState } = useCreatePositionContext()
  const { setPriceRangeState } = usePriceRangeContext()
  const { setDepositState } = useDepositContext()
  const { currencies, protocolVersion } = derivedPositionInfo
  const { fee, hook } = positionState
  const [token0, token1] = currencies
  const versionLabel = getProtocolVersionLabel(protocolVersion)
  const screenSize = useScreenSize()

  const handleEdit = useCallback(() => {
    setPriceRangeState(DEFAULT_PRICE_RANGE_STATE)
    setDepositState(DEFAULT_DEPOSIT_STATE)
    setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  }, [setDepositState, setPriceRangeState, setStep])

  return (
    <EditStep onClick={handleEdit} {...props}>
      <Flex row gap="$gap12">
        <DoubleCurrencyLogo currencies={[token0, token1]} size={!screenSize.sm ? iconSizes.icon44 : iconSizes.icon32} />
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
    derivedPositionInfo: { currencies },
  } = useCreatePositionContext()
  const {
    priceRangeState: { priceInverted },
    derivedPriceRangeInfo,
  } = usePriceRangeContext()
  const { setDepositState } = useDepositContext()

  const { formatNumberOrString } = useLocalizationContext()
  const [baseCurrency, quoteCurrency] = getInvertedTuple(currencies, priceInverted)

  const handleEdit = useCallback(() => {
    setDepositState(DEFAULT_DEPOSIT_STATE)
    setStep(PositionFlowStep.PRICE_RANGE)
  }, [setDepositState, setStep])

  const { formattedPrices, isFullRange } = useMemo(() => {
    return formatPrices(derivedPriceRangeInfo, formatNumberOrString)
  }, [formatNumberOrString, derivedPriceRangeInfo])

  return (
    <EditStep onClick={handleEdit} {...props}>
      <Flex row gap={10}>
        <Text variant="subheading1" width={80}>
          <Trans i18nKey="common.range" />
        </Text>
        {!isFullRange ? (
          <Flex gap="$gap4">
            <Flex row gap={10}>
              <Text variant="body2" color="$neutral2">
                <Trans i18nKey="common.min" />
              </Text>
              <Text variant="body2">{`${formattedPrices[0]} ${quoteCurrency?.symbol + '/' + baseCurrency?.symbol}`}</Text>
            </Flex>
            <Flex row gap={10}>
              <Text variant="body2" color="$neutral2">
                <Trans i18nKey="common.max" />
              </Text>
              <Text variant="body2">{`${formattedPrices[1]} ${quoteCurrency?.symbol + '/' + baseCurrency?.symbol}`}</Text>
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
