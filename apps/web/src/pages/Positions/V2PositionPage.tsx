import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { useGetPoolTokenPercentage } from 'components/Liquidity/hooks/useGetPoolTokenPercentage'
import { LiquidityPositionInfo, LiquidityPositionInfoLoader } from 'components/Liquidity/LiquidityPositionInfo'
import { TextLoader } from 'components/Liquidity/Loader'
import { PositionPageActionButtons } from 'components/Liquidity/PositionPageActionButtons'
import { parseRestPosition } from 'components/Liquidity/utils/parseFromRest'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { useAccount } from 'hooks/useAccount'
import { usePositionOwnerV2 } from 'hooks/usePositionOwnerV2'
import { useV2Pair } from 'hooks/useV2Pairs'
import NotFound from 'pages/NotFound'
import { useMemo } from 'react'
import { ChevronRight } from 'react-feather'
import { Helmet } from 'react-helmet-async/lib/index'
import { Trans, useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { useAppSelector } from 'state/hooks'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { usePendingLPTransactionsChangeListener } from 'state/transactions/hooks'
import { usePairAdder } from 'state/user/hooks'
import { Button, Circle, Flex, Main, Shine, styled, Text } from 'ui/src'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useGetPositionQuery } from 'uniswap/src/data/rest/getPosition'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isEVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useChainIdFromUrlParam } from 'utils/chainParams'

const BodyWrapper = styled(Main, {
  backgroundColor: '$surface1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: 600, // intentionally less than the other LP screens
  zIndex: '$default',
  py: '$spacing24',
  px: '$spacing40',

  $lg: {
    px: '$padding20',
  },
})

function RowLoader({ withIcon }: { withIcon?: boolean }) {
  return (
    <Flex row width="100%" justifyContent="space-between">
      <TextLoader variant="subheading2" width={120} />
      {withIcon ? (
        <Flex row alignItems="center" gap="$gap4">
          <TextLoader variant="body2" width={78} />
          <Circle size={24} backgroundColor="$surface3" />
        </Flex>
      ) : (
        <TextLoader variant="body2" width={72} />
      )}
    </Flex>
  )
}

export default function V2PositionPageWrapper() {
  const chainId = useChainIdFromUrlParam()

  if (chainId && !isEVMChain(chainId)) {
    return <Navigate to="/positions" replace />
  }

  return (
    <MultichainContextProvider initialChainId={chainId}>
      <V2PositionPage />
    </MultichainContextProvider>
  )
}

function V2PositionPage() {
  const { pairAddress } = useParams<{ pairAddress: string }>()
  const chainId = useChainIdFromUrlParam()
  const account = useAccount()
  const supportedAccountChainId = useSupportedChainId(account.chainId)
  const chainInfo = getChainInfo(chainId ?? UniverseChainId.Mainnet)
  const isMigrateV2Enabled = useFeatureFlag(FeatureFlags.MigrateV2)

  const {
    data,
    isLoading: positionLoading,
    refetch,
  } = useGetPositionQuery({
    owner: account.address ?? ZERO_ADDRESS,
    protocolVersion: ProtocolVersion.V2,
    pairAddress,
    chainId: chainId ?? supportedAccountChainId,
  })
  const position = data?.position
  const positionInfo = useMemo(() => parseRestPosition(position), [position])
  const navigate = useNavigate()
  const location = useLocation()
  const { formatCurrencyAmount, formatPercent } = useLocalizationContext()
  const { t } = useTranslation()

  const savedSerializedPairs = useAppSelector(({ user: { pairs } }) => pairs)
  const [, pair] = useV2Pair(positionInfo?.currency0Amount.currency, positionInfo?.currency1Amount.currency)
  const addPair = usePairAdder()

  usePendingLPTransactionsChangeListener(refetch)

  const { currency0Amount, currency1Amount, liquidityAmount } = positionInfo ?? {}

  const token0USDValue = useUSDCValue(currency0Amount)
  const token1USDValue = useUSDCValue(currency1Amount)
  const poolTokenPercentage = useGetPoolTokenPercentage(positionInfo)
  const liquidityTokenAddress = positionInfo?.liquidityToken?.isToken ? positionInfo.liquidityToken.address : undefined
  const isOwner = usePositionOwnerV2({
    account: account.address,
    address: liquidityTokenAddress,
    chainId: positionInfo?.chainId,
  })

  const onMigrate = useEvent(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (pair && chainId && pairAddress && !savedSerializedPairs[chainId]?.[pairAddress]) {
      addPair(pair)
    }
    navigate(isMigrateV2Enabled ? `/migrate/v2/${chainInfo.urlParam}/${pairAddress}` : `/migrate/v2`, {
      state: {
        from: location.pathname,
      },
    })
  })

  if (!positionLoading && (!positionInfo || !liquidityAmount || !currency0Amount || !currency1Amount)) {
    return (
      <NotFound
        title={<Text variant="heading2">{t('position.notFound')}</Text>}
        subtitle={
          <Flex centered maxWidth="75%" mt="$spacing20">
            <Text color="$neutral2" variant="heading3" textAlign="center">
              {t('position.notFound.description')}
            </Text>
          </Flex>
        }
        actionButton={
          <Flex row centered>
            <Button width="fit-content" variant="branded" onPress={() => navigate('/positions')}>
              {t('common.backToPositions')}
            </Button>
          </Flex>
        }
      />
    )
  }

  return (
    <>
      <Helmet>
        <title>
          {t(`liquidityPool.positions.page.title`, {
            quoteSymbol: currency1Amount?.currency.symbol,
            baseSymbol: currency0Amount?.currency.symbol,
          })}
        </title>
      </Helmet>
      <BodyWrapper>
        <Flex gap="$gap20" width="100%">
          <Flex row width="100%" justifyContent="flex-start" alignItems="center">
            <BreadcrumbNavContainer aria-label="breadcrumb-nav">
              <BreadcrumbNavLink to="/positions">
                <Trans i18nKey="pool.positions.title" /> <ChevronRight size={14} />
              </BreadcrumbNavLink>
              {positionInfo && <Text variant="subheading2">{shortenAddress({ address: positionInfo.poolId })}</Text>}
            </BreadcrumbNavContainer>
          </Flex>

          {positionLoading || !positionInfo ? (
            <Shine>
              <LiquidityPositionInfoLoader hideStatus />
            </Shine>
          ) : (
            <LiquidityPositionInfo positionInfo={positionInfo} />
          )}
          <Flex>
            <PositionPageActionButtons buttonFill isOwner={isOwner} positionInfo={positionInfo} onMigrate={onMigrate} />
          </Flex>
          <Flex borderColor="$surface3" borderWidth="$spacing1" p="$spacing24" gap="$gap12" borderRadius="$rounded20">
            {positionLoading || !currency0Amount || !currency1Amount ? (
              <Shine>
                <Flex gap="$gap12">
                  <RowLoader />
                  <RowLoader withIcon />
                  <RowLoader withIcon />
                  <RowLoader withIcon />
                  <RowLoader />
                </Flex>
              </Shine>
            ) : (
              <>
                <Flex row width="100%" justifyContent="space-between">
                  <Text variant="subheading2" color="$neutral2">
                    <Trans i18nKey="position.currentValue" />
                  </Text>
                  <Text variant="body2">
                    {token0USDValue && token1USDValue
                      ? formatCurrencyAmount({
                          value: token0USDValue.add(token1USDValue),
                          type: NumberType.FiatStandard,
                        })
                      : '-'}
                  </Text>
                </Flex>
                <Flex row width="100%" justifyContent="space-between">
                  <Text variant="subheading2" color="$neutral2">
                    <Trans i18nKey="pool.totalTokens" />
                  </Text>
                  <Flex row gap="$gap8">
                    <Text variant="body2">
                      {formatCurrencyAmount({ value: liquidityAmount, type: NumberType.TokenNonTx })}
                    </Text>
                    <DoubleCurrencyLogo currencies={[currency0Amount.currency, currency1Amount.currency]} size={24} />
                  </Flex>
                </Flex>
                <Flex row width="100%" justifyContent="space-between">
                  <Text variant="subheading2" color="$neutral2">
                    <Trans
                      i18nKey="position.depositedCurrency"
                      values={{ currencySymbol: currency0Amount.currency.symbol }}
                    />
                  </Text>
                  <Flex row gap="$gap8">
                    <Text variant="body2">
                      {formatCurrencyAmount({ value: currency0Amount, type: NumberType.TokenNonTx })}
                    </Text>
                    <DoubleCurrencyLogo currencies={[currency0Amount.currency]} size={24} />
                  </Flex>
                </Flex>
                <Flex row width="100%" justifyContent="space-between">
                  <Text variant="subheading2" color="$neutral2">
                    <Trans
                      i18nKey="position.depositedCurrency"
                      values={{ currencySymbol: currency1Amount.currency.symbol }}
                    />
                  </Text>
                  <Flex row gap="$gap8">
                    <Text variant="body2">
                      {formatCurrencyAmount({ value: currency1Amount, type: NumberType.TokenNonTx })}
                    </Text>
                    <DoubleCurrencyLogo currencies={[currency1Amount.currency]} size={24} />
                  </Flex>
                </Flex>
                <Flex row width="100%" justifyContent="space-between">
                  <Text variant="subheading2" color="$neutral2">
                    <Trans i18nKey="addLiquidity.shareOfPool" />
                  </Text>
                  <Text variant="body2">{formatPercent(poolTokenPercentage?.toSignificant(6))}</Text>
                </Flex>
              </>
            )}
          </Flex>
        </Flex>
      </BodyWrapper>
    </>
  )
}
