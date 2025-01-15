// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { LiquidityPositionInfo, LiquidityPositionInfoLoader } from 'components/Liquidity/LiquidityPositionInfo'
import { useGetPoolTokenPercentage } from 'components/Liquidity/hooks'
import { parseRestPosition } from 'components/Liquidity/utils'
import { DoubleCurrencyAndChainLogo } from 'components/Logo/DoubleLogo'
import { ZERO_ADDRESS } from 'constants/misc'
import { usePositionOwnerV2 } from 'hooks/usePositionOwner'
import NotFound from 'pages/NotFound'
import { HeaderButton } from 'pages/Pool/Positions/PositionPage'
import { TextLoader } from 'pages/Pool/Positions/shared'
import { useMemo } from 'react'
import { ChevronRight } from 'react-feather'
import { Helmet } from 'react-helmet-async/lib/index'
import { Trans, useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { usePendingLPTransactionsChangeListener } from 'state/transactions/hooks'
import { Button, Circle, Flex, Main, Shine, Text, styled } from 'ui/src'
import { useGetPositionQuery } from 'uniswap/src/data/rest/getPosition'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { useChainIdFromUrlParam } from 'utils/chainParams'
import { useAccount } from 'wagmi'

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

  const {
    data,
    isLoading: positionLoading,
    refetch,
  } = useGetPositionQuery({
    owner: account?.address ?? ZERO_ADDRESS,
    protocolVersion: ProtocolVersion.V2,
    pairAddress,
    chainId: chainId ?? account.chainId,
  })
  const position = data?.position
  const positionInfo = useMemo(() => parseRestPosition(position), [position])
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { formatCurrencyAmount, formatPercent } = useLocalizationContext()
  const { t } = useTranslation()

  usePendingLPTransactionsChangeListener(refetch)

  const { value: lpRedesignEnabled, isLoading } = useFeatureFlagWithLoading(FeatureFlags.LPRedesign)

  const { currency0Amount, currency1Amount, liquidityAmount } = positionInfo ?? {}

  const token0USDValue = useUSDCValue(currency0Amount)
  const token1USDValue = useUSDCValue(currency1Amount)
  const poolTokenPercentage = useGetPoolTokenPercentage(positionInfo)
  const liquidityTokenAddress = positionInfo?.liquidityToken?.isToken ? positionInfo.liquidityToken.address : null
  const isOwner = usePositionOwnerV2(account?.address, liquidityTokenAddress, positionInfo?.chainId)

  if (!isLoading && !lpRedesignEnabled) {
    return <Navigate to="/pools" replace />
  }

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
        actionButton={<Button onPress={() => navigate('/positions')}>{t('common.backToPositions')}</Button>}
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
              {positionInfo && <Text variant="subheading2">{shortenAddress(positionInfo.poolId)}</Text>}
            </BreadcrumbNavContainer>
          </Flex>

          {positionLoading || !positionInfo ? (
            <Shine>
              <LiquidityPositionInfoLoader hideStatus />
            </Shine>
          ) : (
            <LiquidityPositionInfo positionInfo={positionInfo} />
          )}
          {isOwner && (
            <Flex row gap="$gap12" alignItems="center" maxWidth="100%" flexWrap="wrap">
              <HeaderButton
                disabled={positionLoading}
                emphasis="secondary"
                onPress={() => {
                  navigate('/migrate/v2')
                }}
              >
                <Text variant="buttonLabel2" color="$neutral1">
                  <Trans i18nKey="common.migrate.v3" />
                </Text>
              </HeaderButton>
              <HeaderButton
                disabled={positionLoading}
                emphasis="secondary"
                onPress={() => {
                  dispatch(setOpenModal({ name: ModalName.AddLiquidity, initialState: positionInfo }))
                }}
              >
                <Text variant="buttonLabel2" color="$neutral1">
                  <Trans i18nKey="common.addLiquidity" />
                </Text>
              </HeaderButton>
              <HeaderButton
                disabled={positionLoading}
                emphasis="primary"
                onPress={() => {
                  dispatch(setOpenModal({ name: ModalName.RemoveLiquidity, initialState: positionInfo }))
                }}
              >
                <Text variant="buttonLabel2" color="$surface1">
                  <Trans i18nKey="pool.removeLiquidity" />
                </Text>
              </HeaderButton>
            </Flex>
          )}
          <Flex borderColor="$surface3" borderWidth={1} p="$spacing24" gap="$gap12" borderRadius="$rounded20">
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
                    <DoubleCurrencyAndChainLogo
                      chainId={currency0Amount.currency.chainId}
                      currencies={[currency0Amount?.currency, currency1Amount?.currency]}
                      size={24}
                    />
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
                    <DoubleCurrencyAndChainLogo
                      chainId={currency0Amount?.currency.chainId}
                      currencies={[currency0Amount?.currency]}
                      size={24}
                    />
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
                    <DoubleCurrencyAndChainLogo
                      chainId={currency1Amount?.currency.chainId}
                      currencies={[currency1Amount?.currency]}
                      size={24}
                    />
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
