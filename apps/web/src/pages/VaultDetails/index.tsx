import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { VaultActionPanel } from 'pages/Markets/actionPanels'
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
  Label,
  MainColumn,
  SectionCard,
  SectionTitle,
  SidebarColumn,
  SummaryItem,
  SummaryStrip,
  SummaryValue,
  Value,
  formatPercentValue,
} from 'pages/Markets/detailLayout'
import { useLendingVaultDetails } from 'pages/Markets/hooks'
import { getVaultsBrowseURL } from 'pages/Markets/routes'
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

const AllocationBarTrack = styled(Flex, {
  width: '100%',
  height: 6,
  borderRadius: '$roundedFull',
  backgroundColor: '$surface3',
  overflow: 'hidden',
})

const AllocationBarFill = styled(Flex, {
  height: '100%',
  borderRadius: '$roundedFull',
  backgroundColor: '$accent1',
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

export default function VaultDetailsPage() {
  const { t } = useTranslation()
  const { chainName, vaultId } = useParams<{ chainName: string; vaultId: string }>()
  const navigate = useNavigate()
  const { formatNumber } = useFormatter()
  const { vault, isLoading } = useLendingVaultDetails(vaultId, chainName)

  useEffect(() => {
    if (!isLoading && (!vaultId || !vault)) {
      navigate(getVaultsBrowseURL(), { replace: true })
    }
  }, [isLoading, navigate, vault, vaultId])

  const metaTags = useMemo(
    () => ({
      title: vault?.title ?? t('common.lendingVaultDetails'),
      url: window.location.href,
      description: vault
        ? t('common.inspectOnchainVaultParametersForTitle', { title: vault.title })
        : t('common.inspectOnchainVaultParameters'),
    }),
    [t, vault],
  )

  const dynamicMetatags = useDynamicMetatags(metaTags)

  if (isLoading || !vault) {
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
      label: t('common.totalAssets'),
      value: <Value>{formatTokenOrUsd(vault.totalAssets, vault.asset.symbol, vault.totalAssetsUsd)}</Value>,
    },
    {
      label: t('common.idleAssets'),
      value: <Value>{formatTokenOrUsd(vault.idleAssets, vault.asset.symbol, vault.idleAssetsUsd)}</Value>,
    },
    {
      label: t('common.netApy'),
      value: <Value color="$accent1">{formatPercentValue(vault.apy, 2)}</Value>,
    },
    {
      label: t('common.totalShares'),
      value: <Value>{formatNumber({ input: vault.totalSupplyShares, type: NumberType.TokenQuantityStats })}</Value>,
    },
    {
      label: t('common.sharePrice'),
      value: <Value>{vault.sharePrice.toFixed(6)}</Value>,
    },
    {
      label: t('common.curator'),
      value: <Value>{vault.curator ?? t('common.text.notAvailable')}</Value>,
    },
  ]

  const riskRows = [
    {
      label: t('common.vaultAddress'),
      value: <AddressValue address={vault.vaultAddress} chainId={vault.chainId} type={ExplorerDataType.ADDRESS} />,
    },
    {
      label: t('common.capacity'),
      value: <Value>{formatTokenOrUsd(vault.capacity, vault.asset.symbol, vault.capacityUsd)}</Value>,
    },
    {
      label: t('common.fee'),
      value: <Value>{formatPercentValue(vault.feeRate, 2)}</Value>,
    },
    {
      label: t('common.asset'),
      value: <AddressValue address={vault.asset.address} chainId={vault.chainId} type={ExplorerDataType.TOKEN} />,
    },
  ]

  return (
    <DetailPage>
      <Helmet>
        <title>{`${vault.title} | ${t('common.vaults')}`}</title>
        {dynamicMetatags.map((attributes) => (
          <meta key={`${attributes.property}-${attributes.name}-${attributes.content}`} {...attributes} />
        ))}
      </Helmet>

      <DetailPageInner>
        <BackButton size="small" emphasis="secondary" onPress={() => navigate(getVaultsBrowseURL())}>
          {t('common.backToVaults')}
        </BackButton>

        <HeroHeaderRow>
          <HeroBlock>
            <Flex row gap="$spacing12" alignItems="center">
              <PortfolioLogo
                images={[vault.asset.logoUrl]}
                symbols={[vault.asset.symbol]}
                names={[vault.asset.name]}
                chainId={vault.chainId}
                size={40}
              />
              <HeroTitleGroup>
                <Eyebrow>{vault.chainLabel}</Eyebrow>
                <Text variant="heading1">{vault.title}</Text>
              </HeroTitleGroup>
            </Flex>

            <Flex row gap="$spacing8" flexWrap="wrap">
              <Badge>{vault.asset.symbol}</Badge>
              {vault.curator ? <Badge>{vault.curator}</Badge> : null}
              <Badge>{shortenAddress(vault.vaultAddress)}</Badge>
            </Flex>
          </HeroBlock>
        </HeroHeaderRow>

        <SummaryStrip>
          <SummaryItem>
            <Eyebrow>{t('common.totalAssets')}</Eyebrow>
            <SummaryValue>{formatTokenOrUsd(vault.totalAssets, vault.asset.symbol, vault.totalAssetsUsd)}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <Eyebrow>{t('common.idleAssets')}</Eyebrow>
            <SummaryValue>{formatTokenOrUsd(vault.idleAssets, vault.asset.symbol, vault.idleAssetsUsd)}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <Eyebrow>{t('common.netApy')}</Eyebrow>
            <SummaryValue color="$accent1">{formatPercentValue(vault.apy, 2)}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <Eyebrow>{t('common.sharePrice')}</Eyebrow>
            <SummaryValue>{vault.sharePrice.toFixed(6)}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <Eyebrow>{t('common.capacity')}</Eyebrow>
            <SummaryValue>{formatTokenOrUsd(vault.capacity, vault.asset.symbol, vault.capacityUsd)}</SummaryValue>
          </SummaryItem>
        </SummaryStrip>

        <ContentWithSidebar>
          <MainColumn>
            <DetailDataSection eyebrow={t('common.overview')} title={t('common.overview')} rows={overviewRows} />

            <SectionCard>
              <Flex gap="$spacing6">
                <Eyebrow>{t('common.exposure')}</Eyebrow>
                <SectionTitle>{t('common.marketExposure')}</SectionTitle>
              </Flex>
              <Flex gap="$spacing14">
                {vault.allocations.map((allocation) => (
                  <Flex key={allocation.marketId} gap="$spacing8">
                    <Flex row justifyContent="space-between" gap="$spacing12" flexWrap="wrap">
                      <Label>{allocation.label}</Label>
                      <Value>{formatPercentValue(allocation.share, 0)}</Value>
                    </Flex>
                    <Flex row justifyContent="space-between" gap="$spacing12" flexWrap="wrap">
                      <Label>
                        {formatTokenOrUsd(allocation.suppliedAssets, vault.asset.symbol, allocation.suppliedAssetsUsd)}
                      </Label>
                      <Label>{allocation.enabled ? t('common.enabled') : t('common.disabled')}</Label>
                    </Flex>
                    <Flex row justifyContent="space-between" gap="$spacing12" flexWrap="wrap">
                      <Label>{t('common.cap')}</Label>
                      <Value>
                        {formatTokenOrUsd(allocation.capAssets, vault.asset.symbol, allocation.capAssetsUsd)}
                      </Value>
                    </Flex>
                    <AllocationBarTrack>
                      <AllocationBarFill width={`${Math.max(allocation.share * 100, 4)}%`} />
                    </AllocationBarTrack>
                  </Flex>
                ))}
              </Flex>
            </SectionCard>

            <DetailDataSection eyebrow={t('common.config')} title={t('common.vaultParameters')} rows={riskRows} />
          </MainColumn>

          <SidebarColumn>
            <VaultActionPanel vault={vault} />
          </SidebarColumn>
        </ContentWithSidebar>
      </DetailPageInner>
    </DetailPage>
  )
}
