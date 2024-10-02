import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { useCreatePositionContext, usePriceRangeContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { Container } from 'pages/Pool/Positions/create/shared'
import { PositionFlowStep } from 'pages/Pool/Positions/create/types'
import { useCallback } from 'react'
import { Button, Flex, FlexProps, Text } from 'ui/src'
import { Edit } from 'ui/src/components/icons/Edit'
import { iconSizes } from 'ui/src/theme'
import { Trans } from 'uniswap/src/i18n'

const EditStep = ({ children, onClick, ...rest }: { children: JSX.Element; onClick: () => void } & FlexProps) => {
  return (
    <Container row justifyContent="space-between" alignItems="center" borderRadius="$rounded12" {...rest}>
      {children}
      <Button theme="secondary" py="$spacing8" px="$spacing12" gap="$gap8" height={36} onPress={onClick}>
        <Edit size={iconSizes.icon20} color="$neutral1" />
        <Text variant="buttonLabel3">
          <Trans i18nKey="common.edit.button" />
        </Text>
      </Button>
    </Container>
  )
}

export const EditSelectTokensStep = (props?: FlexProps) => {
  const {
    positionState: {
      tokenInputs: { TOKEN0: token0, TOKEN1: token1 },
    },
    setStep,
  } = useCreatePositionContext()
  const currencies = [token0, token1]

  const handleEdit = useCallback(() => {
    setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  }, [setStep])

  return (
    <EditStep onClick={handleEdit} {...props}>
      <Flex row py="$spacing8" gap="$gap12">
        <DoubleCurrencyLogo currencies={currencies} size={iconSizes.icon32} />
        <Flex row gap="$gap8">
          <Text variant="heading3">{token0?.symbol}</Text>
          <Text variant="heading3">/</Text>
          <Text variant="heading3">{token1?.symbol}</Text>
        </Flex>
      </Flex>
    </EditStep>
  )
}

export const EditRangeSelectionStep = (props?: FlexProps) => {
  const {
    positionState: {
      tokenInputs: { TOKEN0: token0, TOKEN1: token1 },
    },
    setStep,
  } = useCreatePositionContext()
  const {
    priceRangeState: { priceInverted },
  } = usePriceRangeContext()

  const baseCurrency = priceInverted ? token1 : token0
  const quoteCurrency = priceInverted ? token0 : token1

  const handleEdit = useCallback(() => {
    setStep(PositionFlowStep.PRICE_RANGE)
  }, [setStep])

  return (
    <EditStep onClick={handleEdit} {...props}>
      <Flex row gap={10}>
        <Text variant="subheading1" width={80}>
          <Trans i18nKey="common.range" />
        </Text>
        <Flex gap="$gap4">
          <Flex row gap={10}>
            <Text variant="body2" color="$neutral2">
              <Trans i18nKey="chart.price.label.low" />
            </Text>
            <Text variant="body2">{`283,923,000 ${baseCurrency?.symbol + '/' + quoteCurrency?.symbol}`}</Text>
          </Flex>
          <Flex row gap={10}>
            <Text variant="body2" color="$neutral2">
              <Trans i18nKey="chart.price.label.high" />
            </Text>
            <Text variant="body2">{`481,848,481 ${baseCurrency?.symbol + '/' + quoteCurrency?.symbol}`}</Text>
          </Flex>
        </Flex>
      </Flex>
    </EditStep>
  )
}
