import CreatingPoolInfo from 'components/CreatingPoolInfo/CreatingPoolInfo'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { getProtocolVersionLabel } from 'components/Liquidity/utils'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import {
  useCreatePositionContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { Container } from 'pages/Pool/Positions/create/shared'
import { PositionFlowStep } from 'pages/Pool/Positions/create/types'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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
      <Flex gap="$gap12" width="100%">
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
        <CreatingPoolInfo />
      </Flex>
    </EditStep>
  )
}
