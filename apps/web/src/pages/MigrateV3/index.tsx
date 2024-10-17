// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { PositionInfo, parseRestPosition } from 'components/Liquidity/utils'
import { LoadingRows } from 'components/Loader/styled'
import { PoolProgressIndicator } from 'components/PoolProgressIndicator/PoolProgressIndicator'
import { CreatePositionContextProvider, PriceRangeContextProvider } from 'pages/Pool/Positions/create/ContextProviders'
import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { EditSelectTokensStep } from 'pages/Pool/Positions/create/EditStep'
import { SelectPriceRangeStep } from 'pages/Pool/Positions/create/RangeSelectionStep'
import { SelectTokensStep } from 'pages/Pool/Positions/create/SelectTokenStep'
import { PositionFlowStep } from 'pages/Pool/Positions/create/types'
import { LoadingRow } from 'pages/Pool/Positions/shared'
import { useMemo } from 'react'
import { ChevronRight } from 'react-feather'
import { Navigate, useParams } from 'react-router-dom'
import { ClickableTamaguiStyle } from 'theme/components'
import { PositionField } from 'types/position'
import { Flex, Main, Text, styled } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'
import { useGetPositionQuery } from 'uniswap/src/data/rest/getPosition'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { useAccount } from 'wagmi'

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

function MigrateV3Inner({ positionInfo }: { positionInfo: PositionInfo }) {
  const { positionId } = useParams<{ positionId: string }>()
  const { t } = useTranslation()

  const { step, setStep } = useCreatePositionContext()
  const { value: v4Enabled, isLoading: isV4GateLoading } = useFeatureFlagWithLoading(FeatureFlags.V4Everywhere)

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
            <BreadcrumbNavLink to="/positions">
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
            { label: t('migrate.selectFeeTier'), active: step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER },
            { label: t('migrate.setRange'), active: step === PositionFlowStep.PRICE_RANGE },
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
              setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
              // reset any other state here.
            }}
          >
            <RotateLeft color="$neutral1" size={16} />
            <Text variant="buttonLabel4" color="$neutral2">
              <Trans i18nKey="common.button.reset" />
            </Text>
          </Flex>
        </Flex>
        <LiquidityPositionCard liquidityPosition={positionInfo.restPosition} mt="$spacing24" />
        <Flex justifyContent="center" alignItems="center">
          <Flex shrink backgroundColor="$surface2" borderRadius="$rounded12" p="$padding12">
            <ArrowDown size={20} color="$neutral1" />
          </Flex>
        </Flex>

        {step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER ? (
          <SelectTokensStep
            width="100%"
            maxWidth="unset"
            tokensLocked
            onContinue={() => {
              setStep(PositionFlowStep.PRICE_RANGE)
            }}
          />
        ) : (
          <EditSelectTokensStep width="100%" maxWidth="unset" />
        )}
        {step === PositionFlowStep.PRICE_RANGE && (
          <SelectPriceRangeStep
            width="100%"
            maxWidth="unset"
            onContinue={() => {
              // TODO (WEB-4920): submit the migration transaction.
            }}
          />
        )}
      </Flex>
    </BodyWrapper>
  )
}

/**
 * The page for migrating any v3 LP position to v4.
 */
export default function MigrateV3() {
  const { tokenId } = useParams<{ tokenId: string }>()
  const account = useAccount()
  const { data, isLoading: positionLoading } = useGetPositionQuery(
    account.address
      ? {
          owner: account.address,
          protocolVersion: ProtocolVersion.V3,
          tokenId,
          chainId: account.chainId,
        }
      : undefined,
  )
  const position = data?.position
  const positionInfo = useMemo(() => parseRestPosition(position), [position])

  if (positionLoading || !position || !positionInfo) {
    return (
      <BodyWrapper>
        <LoadingRows>
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
        </LoadingRows>
      </BodyWrapper>
    )
  }

  const { currency0Amount, currency1Amount } = positionInfo
  return (
    <CreatePositionContextProvider
      initialState={{
        currencyInputs: {
          [PositionField.TOKEN0]: currency0Amount.currency,
          [PositionField.TOKEN1]: currency1Amount.currency,
        },
      }}
    >
      <PriceRangeContextProvider>
        <MigrateV3Inner positionInfo={positionInfo} />
      </PriceRangeContextProvider>
    </CreatePositionContextProvider>
  )
}
