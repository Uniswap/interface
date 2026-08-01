import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { Button, Circle, Flex, Main, Shine, styled, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useGetPositionQuery } from 'uniswap/src/data/rest/getPosition'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isEVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { parseRestPosition } from 'uniswap/src/features/positions/parseRestPosition'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from '~/components/BreadcrumbNav'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { useEntryPointBreadcrumb } from '~/features/Liquidity/Create/hooks/useEntryPointBreadcrumb'
import { useGetPoolTokenPercentage } from '~/features/Liquidity/hooks/useGetPoolTokenPercentage'
import { LiquidityPositionInfo, LiquidityPositionInfoLoader } from '~/features/Liquidity/LiquidityPositionInfo'
import { TextLoader } from '~/features/Liquidity/Loader'
import { PositionPageActionButtons } from '~/features/Liquidity/PositionPageActionButtons'
import { useAccount } from '~/hooks/useAccount'
import { usePositionOwnerV2 } from '~/hooks/usePositionOwnerV2'
import { useDynamicMetatags } from '~/pages/metatags'
import { NotFound } from '~/pages/NotFound'
import { MultichainContextProvider } from '~/state/multichain/MultichainContext'
import { usePendingLPTransactionsChangeListener } from '~/state/transactions/hooks'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

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

export function V2PositionPageWrapper() {
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

export default V2PositionPageWrapper

// oxlint-disable-next-line complexity
function V2PositionPage() {
  const { pairAddress } = useParams<{ pairAddress: string }>()
  const chainId = useChainIdFromUrlParam()
  const account = useAccount()
  const supportedAccountChainId = useSupportedChainId(account.chainId)
  const chainInfo = getChainInfo(chainId ?? UniverseChainId.Mainnet)
  const breadcrumb = useEntryPointBreadcrumb()

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

  usePendingLPTransactionsChangeListener(refetch)

  const { currency0Amount, currency1Amount, liquidityAmount } = positionInfo ?? {}

  const metatagProperties = useMemo(() => {
    const token0Symbol = currency0Amount?.currency.symbol
    const token1Symbol = currency1Amount?.currency.symbol
    if (!token0Symbol || !token1Symbol || !pairAddress) {
      return { title: 'Position on Uniswap', url: window.location.href }
    }
    const poolName = `${token0Symbol}/${token1Symbol}`
    return {
      title: `${poolName} on Uniswap`,
      url: window.location.href,
      image: `${window.location.origin}/api/image/positions/v2/${chainInfo.urlParam}/${pairAddress}`,
    }
  }, [currency0Amount?.currency.symbol, currency1Amount?.currency.symbol, chainInfo.urlParam, pairAddress])
  const metatags = useDynamicMetatags(metatagProperties)

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
    navigate(`/migrate/v2/${chainInfo.urlParam}/${pairAddress}`, {
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
            <Button width="fit-content" variant="branded" onPress={() => navigate(breadcrumb.to)}>
              {breadcrumb.label}
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
            quoteSymbol: currency1Amount?.currency.symbol ?? t('common.token'),
            baseSymbol: currency0Amount?.currency.symbol ?? t('common.token'),
          })}
        </title>
        {metatags.map((tag, index) => (
          <meta key={index} {...tag} />
        ))}
      </Helmet>
      <BodyWrapper>
        <Flex gap="$gap20" width="100%">
          <Flex row width="100%" justifyContent="flex-start" alignItems="center">
            <BreadcrumbNavContainer aria-label="breadcrumb-nav">
              <BreadcrumbNavLink to={breadcrumb.to}>
                {breadcrumb.label} <RotatableChevron direction="right" size="$icon.16" />
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
                    {t('position.currentValue')}
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
                    {t('pool.totalTokens')}
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
                    {t('position.depositedCurrency', {
                      currencySymbol: currency0Amount.currency.symbol ?? t('common.token'),
                    })}
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
                    {t('position.depositedCurrency', {
                      currencySymbol: currency1Amount.currency.symbol ?? t('common.token'),
                    })}
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
                    {t('addLiquidity.shareOfPool')}
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
