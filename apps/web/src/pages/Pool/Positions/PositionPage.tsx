import { BigNumber } from '@ethersproject/bignumber'
/* eslint-disable-next-line no-restricted-imports */
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { LiquidityPositionAmountsTile } from 'components/Liquidity/LiquidityPositionAmountsTile'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { LiquidityPositionPriceRangeTile } from 'components/Liquidity/LiquidityPositionPriceRangeTile'
import { PositionNFT } from 'components/Liquidity/PositionNFT'
import { useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { parseRestPosition } from 'components/Liquidity/utils'
import { LoadingFullscreen, LoadingRows } from 'components/Loader/styled'
import { ZERO_ADDRESS } from 'constants/misc'
import { usePositionOwner } from 'hooks/usePositionOwner'
import { usePositionTokenURI } from 'hooks/usePositionTokenURI'
import NotFound from 'pages/NotFound'
import { useCanUnwrapCurrency } from 'pages/Pool/Positions/create/utils'
import { LoadingRow } from 'pages/Pool/Positions/shared'
import { useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Helmet } from 'react-helmet-async/lib/index'
import { Trans, useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { usePendingLPTransactionsChangeListener } from 'state/transactions/hooks'
import { ClickableTamaguiStyle } from 'theme/components'
import { Button, Flex, Main, Switch, Text, styled } from 'ui/src'
import { useGetPositionQuery } from 'uniswap/src/data/rest/getPosition'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag, useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageNameLocal, ModalName } from 'uniswap/src/features/telemetry/constants'
import { useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId, currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { addressesAreEquivalent } from 'utils/addressesAreEquivalent'
import { useChainIdFromUrlParam } from 'utils/chainParams'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { useAccount } from 'wagmi'

const BodyWrapper = styled(Main, {
  backgroundColor: '$surface1',
  display: 'flex',
  flexDirection: 'column',
  gap: '$spacing32',
  width: '100%',
  maxWidth: 1200,
  zIndex: '$default',
  py: '$spacing24',
  px: '$spacing40',

  $lg: {
    px: '$padding20',
  },
})

// TODO: replace with Spore button once available
export const HeaderButton = styled(Flex, {
  row: true,
  backgroundColor: '$surface2',
  borderRadius: '$rounded12',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$gap4',
  py: '$padding8',
  px: '$padding12',
  ...ClickableTamaguiStyle,
  variants: {
    emphasis: {
      primary: {
        backgroundColor: '$accent3',
      },
      secondary: {
        backgroundColor: '$surface2',
      },
    },
    disabled: {
      true: {
        cursor: 'default',
        hoverStyle: {
          opacity: 1,
        },
        pressStyle: {
          opacity: 1,
        },
      },
    },
  } as const,
})

function parseTokenId(tokenId: string | undefined): BigNumber | undefined {
  if (!tokenId) {
    return undefined
  }
  try {
    return BigNumber.from(tokenId)
  } catch (error) {
    return undefined
  }
}

export default function PositionPageWrapper() {
  const chainId = useChainIdFromUrlParam()

  return (
    <MultichainContextProvider initialChainId={chainId}>
      <PositionPage />
    </MultichainContextProvider>
  )
}

function PositionPage() {
  const { tokenId: tokenIdFromUrl } = useParams<{ tokenId: string }>()
  const tokenId = parseTokenId(tokenIdFromUrl)
  const chainId = useChainIdFromUrlParam()
  const chainInfo = chainId ? getChainInfo(chainId) : undefined
  const account = useAccount()
  const { pathname } = useLocation()
  const {
    data,
    isLoading: positionLoading,
    refetch,
  } = useGetPositionQuery({
    owner: account?.address ?? ZERO_ADDRESS,
    protocolVersion: pathname.includes('v3')
      ? ProtocolVersion.V3
      : pathname.includes('v4')
        ? ProtocolVersion.V4
        : ProtocolVersion.UNSPECIFIED,
    tokenId: tokenIdFromUrl,
    chainId: chainId ?? account.chainId,
  })
  const position = data?.position
  const positionInfo = useMemo(() => parseRestPosition(position), [position])
  const metadata = usePositionTokenURI(tokenId, chainInfo?.id, positionInfo?.version)
  const owner = usePositionOwner(tokenId, chainInfo?.id, positionInfo?.version)
  usePendingLPTransactionsChangeListener(refetch)

  const dispatch = useAppDispatch()
  const [collectAsWeth, setCollectAsWeth] = useState(false)

  const { value: lpRedesignEnabled, isLoading } = useFeatureFlagWithLoading(FeatureFlags.LPRedesign)
  const isV4DataEnabled = useFeatureFlag(FeatureFlags.V4Data)

  const { formatCurrencyAmount } = useFormatter()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { currency0Amount, currency1Amount, status } = positionInfo ?? {}
  const {
    feeValue0,
    feeValue1,
    fiatFeeValue0,
    fiatFeeValue1,
    token0CurrentPrice,
    token1CurrentPrice,
    fiatValue0,
    fiatValue1,
    priceOrdering,
  } = useV3OrV4PositionDerivedInfo(positionInfo)

  const canUnwrap0 = useCanUnwrapCurrency(currency0Amount?.currency)
  const canUnwrap1 = useCanUnwrapCurrency(currency1Amount?.currency)
  const canUnwrap = positionInfo && chainId && positionInfo.version !== ProtocolVersion.V4 && (canUnwrap0 || canUnwrap1)
  const nativeCurrencyInfo = useNativeCurrencyInfo(chainId ?? UniverseChainId.Mainnet)

  if (!isLoading && !lpRedesignEnabled) {
    return <Navigate to="/pools" replace />
  }

  if (positionLoading) {
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

  if (!position || !positionInfo || !currency0Amount || !currency1Amount) {
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
        actionButton={<Button onPress={() => navigate('/positions')}>{t('common.backToPositions')}</Button>}
      />
    )
  }

  const hasFees = feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) || false
  const isOwner = addressesAreEquivalent(owner, account?.address)

  // TODO (WEB-5859): Use owner from GetPositions instead of on-chain calls

  return (
    <Trace
      logImpression
      page={InterfacePageNameLocal.PositionDetails}
      properties={{
        pool_address: positionInfo.poolId,
        label: [currency0Amount.currency.symbol, currency1Amount.currency.symbol].join('/'),
        type: positionInfo.version,
        fee_tier: typeof positionInfo.feeTier === 'string' ? parseInt(positionInfo.feeTier) : positionInfo.feeTier,
        baseCurrencyId: currencyIdToAddress(currencyId(currency0Amount.currency)),
        quoteCurrencyId: currencyIdToAddress(currencyId(currency1Amount.currency)),
      }}
    >
      <Helmet>
        <title>
          {t(`liquidityPool.positions.page.title`, {
            quoteSymbol: currency1Amount.currency.symbol,
            baseSymbol: currency0Amount.currency.symbol,
          })}
        </title>
      </Helmet>
      <BodyWrapper>
        <Flex gap="$gap20">
          <BreadcrumbNavContainer aria-label="breadcrumb-nav">
            <BreadcrumbNavLink style={{ gap: '8px' }} to="/positions">
              <ArrowLeft size={14} /> <Trans i18nKey="pool.positions.title" />
            </BreadcrumbNavLink>
          </BreadcrumbNavContainer>
          <Flex
            row
            $lg={{ row: false, alignItems: 'flex-start', gap: '$gap16' }}
            justifyContent="space-between"
            alignItems="center"
          >
            <LiquidityPositionInfo positionInfo={positionInfo} />
            {status !== PositionStatus.CLOSED && isOwner && (
              <Flex row gap="$gap12" alignItems="center" flexWrap="wrap">
                {positionInfo.version === ProtocolVersion.V3 && isV4DataEnabled && (
                  <HeaderButton
                    emphasis="secondary"
                    onPress={() => {
                      navigate(`/migrate/v3/${chainInfo?.urlParam}/${tokenIdFromUrl}`)
                    }}
                  >
                    <Text variant="buttonLabel2" color="$neutral1">
                      <Trans i18nKey="pool.migrateToV4" />
                    </Text>
                  </HeaderButton>
                )}
                <HeaderButton
                  emphasis="secondary"
                  onPress={() => {
                    dispatch(
                      setOpenModal({
                        name: ModalName.AddLiquidity,
                        initialState: { ...positionInfo, collectAsWeth },
                      }),
                    )
                  }}
                >
                  <Text variant="buttonLabel2" color="$neutral1">
                    <Trans i18nKey="common.addLiquidity" />
                  </Text>
                </HeaderButton>
                <HeaderButton
                  emphasis="primary"
                  onPress={() => {
                    dispatch(
                      setOpenModal({
                        name: ModalName.RemoveLiquidity,
                        initialState: { ...positionInfo, collectAsWeth },
                      }),
                    )
                  }}
                >
                  <Text variant="buttonLabel2" color="$surface1">
                    <Trans i18nKey="pool.removeLiquidity" />
                  </Text>
                </HeaderButton>
              </Flex>
            )}
          </Flex>
        </Flex>
        <Flex row $lg={{ row: false }} width="100%" gap="$gap16">
          <Flex
            grow
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            justifyContent="center"
            alignItems="center"
            flexBasis="50%"
          >
            {'result' in metadata ? (
              <PositionNFT image={metadata.result.image} height={400} />
            ) : (
              <LoadingFullscreen style={{ borderRadius: 12, backgroundColor: 'transparent' }} />
            )}
          </Flex>
          <Flex grow gap="$gap12" flexBasis="50%">
            <Flex borderRadius="$rounded16" backgroundColor="$surface2" p="$padding12" gap="$gap16">
              <Flex gap="$gap8">
                <Text variant="subheading1">
                  <Trans i18nKey="common.liquidity" />
                </Text>
                <Text variant="heading2">
                  {fiatValue0 && fiatValue1
                    ? formatCurrencyAmount({
                        amount: fiatValue0.add(fiatValue1),
                        type: NumberType.FiatTokenPrice,
                      })
                    : '-'}
                </Text>
              </Flex>
              <LiquidityPositionAmountsTile
                currency0Amount={currency0Amount}
                currency1Amount={currency1Amount}
                fiatValue0={fiatValue0}
                fiatValue1={fiatValue1}
              />
            </Flex>
            <Flex p="$padding12" backgroundColor="$surface2" borderRadius="$rounded16">
              <Flex row width="100%" justifyContent="space-between" alignItems="center">
                <Text variant="subheading1">
                  <Trans i18nKey="pool.uncollectedFees" />
                </Text>
                {hasFees && isOwner && (
                  <HeaderButton
                    emphasis="primary"
                    onPress={() => {
                      if (hasFees) {
                        dispatch(
                          setOpenModal({
                            name: ModalName.ClaimFee,
                            initialState: { ...positionInfo, collectAsWeth },
                          }),
                        )
                      }
                    }}
                  >
                    <Text variant="buttonLabel4" color="$surface1">
                      <Trans i18nKey="pool.collectFees" />
                    </Text>
                  </HeaderButton>
                )}
              </Flex>
              <Text variant="heading2" mt="$spacing8" mb="$spacing16">
                {fiatFeeValue0 && fiatFeeValue1
                  ? formatCurrencyAmount({
                      amount: fiatFeeValue0.add(fiatFeeValue1),
                      type: NumberType.FiatTokenPrice,
                    })
                  : '-'}
              </Text>
              {feeValue0 && feeValue1 && (
                <LiquidityPositionAmountsTile
                  currency0Amount={feeValue0}
                  currency1Amount={feeValue1}
                  fiatValue0={fiatFeeValue0}
                  fiatValue1={fiatFeeValue1}
                />
              )}
              {canUnwrap && (
                <Flex row width="100%" justifyContent="space-between" mt="$spacing16" alignItems="center">
                  <Text variant="body1">
                    <Trans
                      i18nKey="pool.collectAs"
                      values={{ nativeWrappedSymbol: nativeCurrencyInfo?.currency.wrapped.symbol }}
                    />
                  </Text>
                  <Switch
                    variant="default"
                    checked={collectAsWeth}
                    onCheckedChange={() => {
                      setCollectAsWeth((prev) => !prev)
                    }}
                  />
                </Flex>
              )}
            </Flex>
          </Flex>
        </Flex>
        {priceOrdering && token0CurrentPrice && token1CurrentPrice && (
          <LiquidityPositionPriceRangeTile
            token1={positionInfo.currency1Amount.currency}
            priceOrdering={priceOrdering}
            feeTier={positionInfo.feeTier?.toString()}
            tickLower={positionInfo.tickLower}
            tickUpper={positionInfo.tickUpper}
            token0CurrentPrice={token0CurrentPrice}
            token1CurrentPrice={token1CurrentPrice}
          />
        )}
      </BodyWrapper>
    </Trace>
  )
}
