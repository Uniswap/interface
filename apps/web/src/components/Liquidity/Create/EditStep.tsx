import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import CreatingPoolInfo from 'components/CreatingPoolInfo/CreatingPoolInfo'
import { Container } from 'components/Liquidity/Create/Container'
import { DisplayCurrentPrice } from 'components/Liquidity/Create/RangeSelectionStep'
import { useDefaultInitialPrice } from 'components/Liquidity/Create/hooks/useDefaultInitialPrice'
import { PositionFlowStep } from 'components/Liquidity/Create/types'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PositionField } from 'types/position'
import { Button, Flex, FlexProps, Text, useMedia } from 'ui/src'
import { Edit } from 'ui/src/components/icons/Edit'
import { iconSizes } from 'ui/src/theme'

const EditStep = ({ children, onClick, ...rest }: { children: JSX.Element; onClick: () => void } & FlexProps) => {
  const { t } = useTranslation()
  return (
    <Container row gap="$gap24" justifyContent="space-between" alignItems="center" {...rest}>
      {children}
      <Flex row>
        <Button
          maxWidth="fit-content"
          emphasis="secondary"
          size="small"
          onPress={onClick}
          icon={<Edit size="$icon.20" />}
        >
          {t('common.edit.button')}
        </Button>
      </Flex>
    </Container>
  )
}

export const EditSelectTokensStep = (props?: FlexProps) => {
  const {
    setStep,
    protocolVersion,
    creatingPoolOrPair,
    currencies: { display },
    positionState,
    resetDeposit: resetDepositState,
    resetPriceRange: resetPriceRangeState,
  } = useCreateLiquidityContext()

  const { fee, hook } = positionState
  const { TOKEN0, TOKEN1 } = display
  const media = useMedia()

  const handleEdit = useCallback(() => {
    resetPriceRangeState()
    resetDepositState()
    setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  }, [resetDepositState, resetPriceRangeState, setStep])

  const { price: defaultInitialPrice } = useDefaultInitialPrice({
    currencies: {
      [PositionField.TOKEN0]: display.TOKEN0,
      [PositionField.TOKEN1]: display.TOKEN1,
    },
    skip: creatingPoolOrPair,
  })

  return (
    <EditStep onClick={handleEdit} {...props}>
      <Flex gap="$gap12" width="100%">
        <Flex row gap="$gap12">
          <DoubleCurrencyLogo
            currencies={[TOKEN0 ?? undefined, TOKEN1 ?? undefined]}
            size={media.md ? iconSizes.icon44 : iconSizes.icon32}
          />
          <Flex row gap="$gap12" $md={{ flexDirection: 'column', gap: '$gap4' }}>
            <Flex row gap="$gap8" alignItems="center">
              <Text variant="subheading1">{TOKEN0?.symbol}</Text>
              <Text variant="subheading1">/</Text>
              <Text variant="subheading1">{TOKEN1?.symbol}</Text>
            </Flex>
            <Flex row gap={2} alignItems="center">
              <LiquidityPositionInfoBadges size="small" version={protocolVersion} v4hook={hook} feeTier={fee} />
            </Flex>
          </Flex>
        </Flex>
        {creatingPoolOrPair ? (
          <CreatingPoolInfo />
        ) : protocolVersion === ProtocolVersion.V2 ? (
          <DisplayCurrentPrice price={defaultInitialPrice} />
        ) : null}
      </Flex>
    </EditStep>
  )
}
