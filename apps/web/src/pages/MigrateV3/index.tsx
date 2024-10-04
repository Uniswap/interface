import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { usePositionInfo } from 'components/Liquidity/utils'
import { PoolProgressIndicator } from 'components/PoolProgressIndicator/PoolProgressIndicator'
import { useState } from 'react'
import { ChevronRight } from 'react-feather'
import { Navigate, useParams } from 'react-router-dom'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, Main, Text, styled } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import { Trans, useTranslation } from 'uniswap/src/i18n'

const BodyWrapper = styled(Main, {
  backgroundColor: '$surface1',
  display: 'flex',
  flexDirection: 'row',
  gap: 60,
  mt: '1rem',
  mx: 'auto',
  width: '100%',
  zIndex: '$default',
  p: 24,
})

enum MigrateStep {
  SELECT_FEE_TIER,
  SET_PRICE_RANGE,
}

/**
 * The page for migrating any v3 LP position to v4.
 */
export default function MigrateV3() {
  const { positionId } = useParams<{ positionId: string }>()
  const { t } = useTranslation()
  const [step, setStep] = useState(MigrateStep.SELECT_FEE_TIER)
  const { value: v4Enabled, isLoading: isV4GateLoading } = useFeatureFlagWithLoading(FeatureFlags.V4Everywhere)

  // TODO(WEB-4920): replace this with real data fetching
  const { data } = useGetPositionsQuery()
  const position = data?.positions[2]
  const positionInfo = usePositionInfo(position)

  if (!position || !positionInfo) {
    // TODO(WEB-4920): handle loading/error states (including if the position is for v2)
    return null
  }

  const { currency0Amount, currency1Amount } = positionInfo

  if (!isV4GateLoading && !v4Enabled) {
    return <Navigate to="/pools" replace />
  }

  if (isV4GateLoading) {
    return null
  }

  return (
    <BodyWrapper>
      <Flex maxWidth={360}>
        {/* nav breadcrumbs */}
        <Flex width="100%">
          <BreadcrumbNavContainer aria-label="breadcrumb-nav">
            <BreadcrumbNavLink to="/pool">
              <Trans i18nKey="pool.positions.title" /> <ChevronRight size={14} />
            </BreadcrumbNavLink>
            <BreadcrumbNavLink to={`/explore/position/${positionId}`}>
              {currency0Amount.currency.symbol} / {currency1Amount.currency.symbol} <ChevronRight size={14} />
            </BreadcrumbNavLink>
          </BreadcrumbNavContainer>
        </Flex>
        <Text width="100%" variant="heading2" mt="$spacing20">
          <Trans i18nKey="common.migrate.position" />
        </Text>
        <PoolProgressIndicator
          mt="$spacing32"
          steps={[
            { label: t('migrate.selectFeeTier'), active: step === MigrateStep.SELECT_FEE_TIER },
            { label: t('migrate.setRange'), active: step === MigrateStep.SET_PRICE_RANGE },
          ]}
        />
      </Flex>
      <Flex flex={3} gap="$gap12">
        <Flex mt={44} row justifyContent="flex-end">
          {/* TODO: replace with Spore button once available */}
          <Flex
            row
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            alignItems="center"
            justifyContent="center"
            gap="$gap4"
            py="$padding8"
            px="$padding12"
            {...ClickableTamaguiStyle}
            onPress={() => {
              setStep(MigrateStep.SELECT_FEE_TIER)
              // reset any other state here.
            }}
          >
            <RotateLeft color="$neutral1" size={16} />
            <Text variant="buttonLabel4" color="$neutral2">
              <Trans i18nKey="common.button.reset" />
            </Text>
          </Flex>
        </Flex>
        <LiquidityPositionCard liquidityPosition={position} mt="$spacing24" />
        <Flex justifyContent="center" alignItems="center">
          <Flex shrink backgroundColor="$surface2" borderRadius="$rounded12" p="$padding12">
            <ArrowDown size={20} color="$neutral1" />
          </Flex>
        </Flex>
      </Flex>
      {/* TODO: fee tier selection component. collapse if step === SET_PRICE_RANGE */}
      {/* TODO: price range component. hide if step === SELECT_FEE_TIER */}
    </BodyWrapper>
  )
}
