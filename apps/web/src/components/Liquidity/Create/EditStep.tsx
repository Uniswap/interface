import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import CreatingPoolInfo from 'components/CreatingPoolInfo/CreatingPoolInfo'
import { useDefaultInitialPrice } from 'components/Liquidity/Create/hooks/useDefaultInitialPrice'
import { PositionFlowStep } from 'components/Liquidity/Create/types'
import { DisplayCurrentPrice } from 'components/Liquidity/DisplayCurrentPrice'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PositionField } from 'types/position'
import { Button, Flex, Text, useMedia } from 'ui/src'
import { Edit } from 'ui/src/components/icons/Edit'
import { iconSizes } from 'ui/src/theme'

export const EditSelectTokensStep = () => {
  const { t } = useTranslation()
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
    <Flex gap="$gap12">
      <Flex row gap="$gap12" alignItems="center">
        <DoubleCurrencyLogo
          currencies={[TOKEN0 ?? undefined, TOKEN1 ?? undefined]}
          size={media.md ? iconSizes.icon44 : iconSizes.icon32}
        />
        <Flex row grow gap="$gap12" $md={{ flexDirection: 'column', gap: '$gap4' }}>
          <Flex row gap="$gap8" alignItems="center">
            <Text variant="subheading1">{TOKEN0?.symbol}</Text>
            <Text variant="subheading1">/</Text>
            <Text variant="subheading1">{TOKEN1?.symbol}</Text>
          </Flex>
          <Flex row gap={2} alignItems="center">
            <LiquidityPositionInfoBadges size="small" version={protocolVersion} v4hook={hook} feeTier={fee} />
          </Flex>
        </Flex>
        <Flex flexShrink={0}>
          <Button fill={false} emphasis="secondary" size="small" onPress={handleEdit} icon={<Edit size="$icon.20" />}>
            {t('common.edit.button')}
          </Button>
        </Flex>
      </Flex>
      {creatingPoolOrPair ? (
        <CreatingPoolInfo />
      ) : protocolVersion === ProtocolVersion.V2 ? (
        <DisplayCurrentPrice price={defaultInitialPrice} />
      ) : null}
    </Flex>
  )
}
