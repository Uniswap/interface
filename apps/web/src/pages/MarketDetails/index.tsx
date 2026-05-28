import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { HealthFactorBar, MarketActionPanel } from 'pages/Markets/actionPanels'
import {
  Badge,
  ContentWithSidebar,
  DetailDataSection,
  DetailPage,
  DetailPageInner,
  Eyebrow,
  HeroBlock,
  HeroHeaderRow,
  HeroTitleGroup,
  MainColumn,
  SidebarColumn,
  SummaryItem,
  SummaryStrip,
  SummaryValue,
  Value,
  formatPercentValue,
} from 'pages/Markets/detailLayout'
import { useLendingMarketDetails } from 'pages/Markets/hooks'
import { getMarketsBrowseURL } from 'pages/Markets/routes'
import { useDynamicMetatags } from 'pages/metatags'
import { useCallback, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Flex, Text, styled } from 'ui/src'
import { SpinningLoader } from 'ui/src/loading/SpinningLoader'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { NumberType, useFormatter } from 'utils/formatNumbers'

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const CopyButton = styled(Flex, {
  cursor: 'pointer',
  hoverStyle: { opacity: 0.7 },
  px: '$spacing4',
})

const BackButton = styled(Button, {
  alignSelf: 'flex-start',
  px: '$spacing16',
  py: '$spacing12',
  minHeight: 44,
  borderRadius: '$roundedFull',
})

function AddressValue({ address, chainId, type }: { address: string; chainId: number; type: ExplorerDataType }) {
  const explorerUrl = getExplorerLink(chainId, address, type)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(address)
  }, [address])

  return (
    <Flex row alignItems="center" gap="$spacing6">
      <Value>{shortenAddress(address)}</Value>
      <CopyButton onPress={handleCopy}>
        <Text variant="body4" color="$neutral3">
          Copy
        </Text>
      </CopyButton>
      <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        <Text variant="body4" color="$accent1">
          ↗
        </Text>
      </a>
    </Flex>
  )
}

export default function MarketDetailsPage() {
  const { t } = useTranslation()
  const { chainName, marketId } = useParams<{ chainName: string; marketId: string }>()
  const navigate = useNavigate()
  const { formatNumber } = useFormatter()
  const { market, isLoading } = useLendingMarketDetails(marketId, chainName)

  useEffect(() => {
    if (!isLoading && (!marketId || !market)) {
      navigate(getMarketsBrowseURL(), { replace: true })
    }
  }, [isLoading, market, marketId, navigate])

  const metaTags = useMemo(
    () => ({
      title: market
        ? `${market.loanAsset.symbol} / ${market.collateralAsset.symbol}`
        : t('common.lendingMarketDetails'),
      url: window.location.href,
      description: market
        ? t('common.inspectOnchainLendingMarketParametersForPair', {
            pair: `${market.loanAsset.symbol} / ${market.collateralAsset.symbol}`,
          })
        : t('common.inspectOnchainLendingMarketParameters'),
    }),
    [market, t],
  )

  const dynamicMetatags = useDynamicMetatags(metaTags)

  if (isLoading || !market) {
    return (
      <DetailPage>
        <DetailPageInner>
          <Flex alignItems="center" justifyContent="center" py="$spacing64">
            <SpinningLoader size={32} />
          </Flex>
        </DetailPageInner>
      </DetailPage>
    )
  }

  const formatTokenOrUsd = (amount: number, symbol: string, usd?: number) =>
    usd !== undefined
      ? formatNumber({ input: usd, type: NumberType.FiatTokenStats })
      : `${formatNumber({ input: amount, type: NumberType.TokenQuantityStats })} ${symbol}`

  const overviewRows = [
    {
      label: t('common.totalSupplied'),
      value: <Value>{formatTokenOrUsd(market.totalSupply, market.loanAsset.symbol, market.totalSupplyUsd)}</Value>,
    },
    {
      label: t('common.totalBorrowed'),
      value: <Value>{formatTokenOrUsd(market.totalBorrow, market.loanAsset.symbol, market.totalBorrowUsd)}</Value>,
    },
    {
      label: t('common.liquidity'),
      value: <Value>{formatTokenOrUsd(market.liquidity, market.loanAsset.symbol, market.liquidityUsd)}</Value>,
    },
    {
      label: t('common.supplyApy'),
      value: <Value color="$accent1">{formatPercentValue(market.supplyApy, 2)}</Value>,
    },
    {
      label: t('common.borrowApy'),
      value: <Value>{formatPercentValue(market.borrowApy, 2)}</Value>,
    },
    {
      label: t('common.collateral'),
      value: <Value>{market.collateralAsset.symbol}</Value>,
    },
  ]

  const riskRows = [
    {
      label: t('common.marketId'),
      value: <AddressValue address={market.marketId} chainId={market.chainId} type={ExplorerDataType.ADDRESS} />,
    },
    {
      label: t('common.oracle'),
      value: <AddressValue address={market.oracleAddress} chainId={market.chainId} type={ExplorerDataType.ADDRESS} />,
    },
    {
      label: t('common.oraclePrice'),
      value: (
        <Value>
          {market.oraclePrice !== undefined
            ? `${market.oraclePrice.toFixed(4)} ${market.loanAsset.symbol} / ${market.collateralAsset.symbol}`
            : t('common.text.notAvailable')}
        </Value>
      ),
    },
    {
      label: 'IRM',
      value: <AddressValue address={market.irmAddress} chainId={market.chainId} type={ExplorerDataType.ADDRESS} />,
    },
    {
      label: t('common.fee'),
      value: <Value>{formatPercentValue(market.feeRate, 2)}</Value>,
    },
    {
      label: 'LLTV',
      value: <Value>{formatPercentValue(market.lltv, 0)}</Value>,
    },
    {
      label: t('common.lastUpdate'),
      value: <Value>{new Date(market.lastUpdate * 1000).toLocaleString()}</Value>,
    },
  ]

  return (
    <DetailPage>
      <Helmet>
        <title>{`${market.loanAsset.symbol} / ${market.collateralAsset.symbol} | ${t('common.lending')}`}</title>
        {dynamicMetatags.map((attributes) => (
          <meta key={`${attributes.property}-${attributes.name}-${attributes.content}`} {...attributes} />
        ))}
      </Helmet>

      <DetailPageInner>
        <BackButton size="small" emphasis="secondary" onPress={() => navigate(getMarketsBrowseURL())}>
          <Text variant="buttonLabel3">{t('common.backToLending')}</Text>
        </BackButton>

        <HeroHeaderRow>
          <HeroBlock>
            <Flex row gap="$spacing12" alignItems="center">
              <PortfolioLogo
                images={[market.loanAsset.logoUrl, market.collateralAsset.logoUrl]}
                symbols={[market.loanAsset.symbol, market.collateralAsset.symbol]}
                names={[market.loanAsset.name, market.collateralAsset.name]}
                chainId={market.chainId}
                size={40}
              />
              <HeroTitleGroup>
                <Eyebrow>{market.chainLabel}</Eyebrow>
                <Text variant="heading1">
                  {market.loanAsset.symbol} / {market.collateralAsset.symbol}
                </Text>
              </HeroTitleGroup>
            </Flex>

            <Flex row gap="$spacing8" flexWrap="wrap">
              <Badge>{shortenAddress(market.marketId)}</Badge>
              <Badge>{shortenAddress(market.oracleAddress)}</Badge>
              <Badge>{formatPercentValue(market.lltv, 0)} LLTV</Badge>
            </Flex>
          </HeroBlock>
        </HeroHeaderRow>

        <SummaryStrip>
          <SummaryItem>
            <Eyebrow>{t('common.liquidity')}</Eyebrow>
            <SummaryValue>
              {formatTokenOrUsd(market.liquidity, market.loanAsset.symbol, market.liquidityUsd)}
            </SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <Eyebrow>{t('common.supplyApy')}</Eyebrow>
            <SummaryValue color="$accent1">{formatPercentValue(market.supplyApy, 2)}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <Eyebrow>{t('common.borrowApy')}</Eyebrow>
            <SummaryValue>{formatPercentValue(market.borrowApy, 2)}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <Eyebrow>LLTV</Eyebrow>
            <SummaryValue>{formatPercentValue(market.lltv, 0)}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <Eyebrow>{t('common.utilization')}</Eyebrow>
            <SummaryValue>{formatPercentValue(market.utilization, 1)}</SummaryValue>
          </SummaryItem>
        </SummaryStrip>

        <ContentWithSidebar>
          <MainColumn>
            <DetailDataSection eyebrow={t('common.overview')} title={t('common.overview')} rows={overviewRows} />
            <HealthFactorBar market={market} />
            <DetailDataSection eyebrow={t('common.risk')} title={t('common.protocolParameters')} rows={riskRows} />
          </MainColumn>

          <SidebarColumn>
            <MarketActionPanel market={market} />
          </SidebarColumn>
        </ContentWithSidebar>
      </DetailPageInner>
    </DetailPage>
  )
}
