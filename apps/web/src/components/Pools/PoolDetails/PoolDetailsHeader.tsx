import { useQuery } from '@tanstack/react-query'
import { Percent } from '@uniswap/sdk-core'
import { getTokenDetailsURL, gqlToRingCurrency, unwrapFewToken } from 'appGraphql/data/util'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from 'components/BreadcrumbNav'
import { DropdownSelector } from 'components/DropdownSelector'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { ExplorerIcon } from 'components/Icons/ExplorerIcon'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { LpIncentivesAprDisplay } from 'components/LpIncentives/LpIncentivesAprDisplay'
import { DetailBubble } from 'components/Pools/PoolDetails/shared'
import ShareButton from 'components/Tokens/TokenDetails/ShareButton'
import { ActionButtonStyle } from 'components/Tokens/TokenDetails/shared'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import Row from 'components/deprecated/Row'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import styled, { keyframes, useTheme } from 'lib/styled-components'
import { ReversedArrowsIcon } from 'nft/components/iconExports'
import { StarIcon } from 'pages/Referral/Components/OverviewIcon'
import React, { useMemo, useState } from 'react'
import { ChevronRight, ExternalLink as ExternalLinkIcon } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useDefaultRingActiveTokens } from 'state/lists/hooks'
import { ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components/Links'
import { ClickableTamaguiStyle, EllipsisTamaguiStyle } from 'theme/components/styles'
import { Flex, Shine, Text, TouchableArea, styled as tamaguiStyled, useIsTouchDevice, useMedia } from 'ui/src'
import { Token as RingToken } from 'uniswap/src/data/graphql/ringswap-data-api/__generated__/types-and-hooks'
import { ProtocolVersion, Token } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import {
  REFERRAL_WHITELIST_POOL_API_URL,
  fetchReferralWhitelistData,
  type ReferralWhitelistResponse,
} from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/referralRewardUtils'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { getChainUrlParam } from 'utils/chainParams'

const StyledExternalLink = styled(ExternalLink)`
  &:hover {
    // Override hover behavior from ExternalLink
    opacity: 1;
  }
`

const whitelistStarFlip = keyframes`
  0% {
    transform: rotateY(0deg);
  }
  75% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(360deg);
  }
`

const AnimatedWhitelistStarWrapper = styled.span`
  display: inline-flex;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  animation: ${whitelistStarFlip} 4s ease-in-out infinite;
`

interface PoolDetailsBreadcrumbProps {
  chainId?: UniverseChainId
  poolAddress?: string
  token0?: Token
  token1?: Token
  loading?: boolean
}

export function PoolDetailsBreadcrumb({ chainId, poolAddress, token0, token1, loading }: PoolDetailsBreadcrumbProps) {
  const { defaultChainId } = useEnabledChains()
  const chainUrlParam = getChainUrlParam(chainId ?? defaultChainId)
  const unwrappedToken0 = unwrapFewToken(chainId ?? defaultChainId, token0)
  const unwrappedToken1 = unwrapFewToken(chainId ?? defaultChainId, token1)
  const exploreOrigin = `/explore/${chainUrlParam}`
  const poolsOrigin = `/explore/pools/${chainUrlParam}`

  return (
    <BreadcrumbNavContainer aria-label="breadcrumb-nav">
      <BreadcrumbNavLink to={exploreOrigin}>
        <Trans i18nKey="common.explore" /> <ChevronRight size={14} />
      </BreadcrumbNavLink>
      <BreadcrumbNavLink to={poolsOrigin}>
        <Trans i18nKey="common.pools" /> <ChevronRight size={14} />
      </BreadcrumbNavLink>
      {loading || !poolAddress ? (
        <Shine>
          <Flex width={80} height={20} borderRadius={20} backgroundColor="$surface3" />
        </Shine>
      ) : (
        <CurrentPageBreadcrumb
          address={poolAddress}
          poolName={`${unwrappedToken0?.symbol} / ${unwrappedToken1?.symbol}`}
        />
      )}
    </BreadcrumbNavContainer>
  )
}

const PoolDetailsTitle = ({
  token0,
  token1,
  chainId,
  feeTier,
  protocolVersion,
  toggleReversed,
  hookAddress,
}: {
  token0?: Token
  token1?: Token
  chainId?: UniverseChainId
  feeTier?: number
  protocolVersion?: ProtocolVersion
  toggleReversed: React.DispatchWithoutAction
  hookAddress?: string
}) => {
  const theme = useTheme()
  const { defaultChainId } = useEnabledChains()
  const graphQLChain = toGraphQLChain(chainId ?? defaultChainId)
  const unwrappedToken0 = unwrapFewToken(chainId ?? defaultChainId, token0)
  const unwrappedToken1 = unwrapFewToken(chainId ?? defaultChainId, token1)
  return (
    <Flex row gap="$spacing12" alignItems="center" width="max-content">
      <Flex>
        <Text variant="heading1" fontSize={24} color="neutral1" $md={{ variant: 'subheading1', fontSize: 18 }}>
          <StyledLink
            to={getTokenDetailsURL({
              address: token0?.address,
              chain: graphQLChain,
            })}
          >
            {unwrappedToken0?.symbol}
          </StyledLink>
          &nbsp;/&nbsp;
          <StyledLink
            to={getTokenDetailsURL({
              address: token1?.address,
              chain: graphQLChain,
            })}
          >
            {unwrappedToken1?.symbol}
          </StyledLink>
        </Text>
      </Flex>
      <Flex row gap="$spacing2">
        <LiquidityPositionInfoBadges
          versionLabel={protocolVersion?.toLowerCase()}
          v4hook={hookAddress}
          feeTier={feeTier}
          size="default"
        />
      </Flex>
      <TouchableArea
        hoverable
        {...ClickableTamaguiStyle}
        onPress={toggleReversed}
        testID="toggle-tokens-reverse-arrows"
      >
        <ReversedArrowsIcon size="20px" color={theme.neutral2} />
      </TouchableArea>
    </Flex>
  )
}

const ContractsDropdownRowContainer = tamaguiStyled(Flex, {
  row: true,
  alignItems: 'center',
  cursor: 'pointer',
  gap: '$gap12',
  px: '$padding6',
  py: '$padding8',
  borderRadius: '$rounded8',
  ...EllipsisTamaguiStyle,
  '$platform-web': {
    textDecoration: 'none',
  },
  hoverStyle: {
    background: '$surface3',
  },
})

const ContractsDropdownRow = ({
  address,
  chainId,
  tokens,
}: {
  address?: string
  chainId?: number
  tokens: ((RingToken & { logoUrl?: string; isNative?: boolean }) | undefined)[]
}) => {
  const theme = useTheme()
  const isPool = tokens.length === 2
  const ringTokens = useDefaultRingActiveTokens(chainId)
  const token0Info = Object.values(ringTokens).find(
    (item) => item.address.toLowerCase() === tokens[0]?.originToken?.address?.toLowerCase(),
  ) as any
  const unwrapedToken0 = unwrapFewToken(chainId ?? UniverseChainId.Mainnet, tokens[0], token0Info?.logoURI)
  const isNative = unwrapedToken0?.address === NATIVE_CHAIN_ID
  const nativeLogo = getChainInfo(chainId ?? UniverseChainId.Mainnet).nativeCurrency.logo
  const explorerUrl =
    chainId &&
    address &&
    getExplorerLink(
      chainId,
      address,
      isNative ? ExplorerDataType.NATIVE : isPool ? ExplorerDataType.ADDRESS : ExplorerDataType.TOKEN,
    )

  if (!chainId || !explorerUrl) {
    return (
      <ContractsDropdownRowContainer>
        <DetailBubble $width={117} />
      </ContractsDropdownRowContainer>
    )
  }

  return (
    <StyledExternalLink href={explorerUrl}>
      <ContractsDropdownRowContainer>
        <Row gap="sm">
          {isPool ? (
            <PortfolioLogo
              chainId={chainId}
              images={[
                (tokens[0]?.isNative ? nativeLogo : tokens[0]?.logoUrl) as string,
                (tokens[1]?.isNative ? nativeLogo : tokens[1]?.logoUrl) as string,
              ]}
              size={24}
            />
          ) : (
            <PortfolioLogo
              chainId={chainId}
              images={[(isNative ? nativeLogo : tokens[0]?.logoUrl) as string]}
              size={24}
            />
          )}
          <ThemedText.BodyPrimary>
            {isPool ? <Trans i18nKey="common.pool" /> : unwrapedToken0?.symbol}
          </ThemedText.BodyPrimary>
          <ThemedText.BodySecondary>{shortenAddress(address)}</ThemedText.BodySecondary>
        </Row>
        <ExternalLinkIcon size="16px" stroke={theme.neutral2} />
      </ContractsDropdownRowContainer>
    </StyledExternalLink>
  )
}

const PoolDetailsHeaderActions = ({
  chainId,
  poolAddress,
  poolName,
  token0,
  token1,
  protocolVersion,
}: {
  chainId?: number
  poolAddress?: string
  poolName: string
  token0?: RingToken
  token1?: RingToken
  protocolVersion?: ProtocolVersion
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isTouchDevice = useIsTouchDevice()
  const [contractsModalIsOpen, toggleContractsModal] = useState(false)
  const ringTokens = useDefaultRingActiveTokens(chainId)
  const token0Info = Object.values(ringTokens).find(
    (item) => item.address.toLowerCase() === token0?.originToken?.address?.toLowerCase(),
  ) as any
  const token1Info = Object.values(ringTokens).find(
    (item) => item.address.toLowerCase() === token1?.originToken?.address?.toLowerCase(),
  ) as any
  const unwrappedToken0 = unwrapFewToken(chainId ?? UniverseChainId.Mainnet, token0, token0Info?.logoURI)
  const unwrappedToken1 = unwrapFewToken(chainId ?? UniverseChainId.Mainnet, token1, token1Info?.logoURI)
  const { data: whitelistData } = useQuery<ReferralWhitelistResponse>({
    queryKey: [ReactQueryCacheKey.ReferralWhitelistPools, REFERRAL_WHITELIST_POOL_API_URL],
    queryFn: fetchReferralWhitelistData,
    enabled: Boolean(REFERRAL_WHITELIST_POOL_API_URL),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  })

  const poolIdentifier = poolAddress?.toLowerCase()
  const isWhitelisted = Boolean(poolIdentifier && whitelistData?.pools.some((p) => p.address === poolIdentifier))

  return (
    <Row width="max-content" justify="flex-end" gap="sm">
      {isWhitelisted ? (
        <Flex alignItems="center" justifyContent="center" paddingHorizontal="$spacing12">
          <MouseoverTooltip size={TooltipSize.Max} text={t('referral.pool.whitelist.tooltip')} placement="top">
            <AnimatedWhitelistStarWrapper>
              <StarIcon size={18} />
            </AnimatedWhitelistStarWrapper>
          </MouseoverTooltip>
        </Flex>
      ) : null}
      <DropdownSelector
        isOpen={contractsModalIsOpen}
        toggleOpen={toggleContractsModal}
        menuLabel={
          chainId === UniverseChainId.Mainnet ? (
            <EtherscanLogo width="18px" height="18px" fill={theme.neutral1} />
          ) : (
            <ExplorerIcon width="18px" height="18px" fill={theme.neutral1} />
          )
        }
        tooltipText={isTouchDevice ? undefined : t('pool.explorers')}
        hideChevron
        buttonStyle={ActionButtonStyle}
        dropdownStyle={{ minWidth: 235 }}
        alignRight
      >
        <>
          {protocolVersion !== ProtocolVersion.V4 && (
            <ContractsDropdownRow address={poolAddress} chainId={chainId} tokens={[unwrappedToken0, unwrappedToken1]} />
          )}
          <ContractsDropdownRow address={unwrappedToken0?.address} chainId={chainId} tokens={[unwrappedToken0]} />
          <ContractsDropdownRow address={unwrappedToken1?.address} chainId={chainId} tokens={[unwrappedToken1]} />
        </>
      </DropdownSelector>
      <ShareButton name={poolName} utmSource="share-pool" />
    </Row>
  )
}

const StyledLink = tamaguiStyled(Link, {
  color: '$neutral1',
  ...ClickableTamaguiStyle,
  '$platform-web': {
    textDecoration: 'none',
  },
})

interface PoolDetailsHeaderProps {
  chainId?: number
  poolAddress?: string
  token0?: RingToken
  token1?: RingToken
  feeTier?: number
  protocolVersion?: ProtocolVersion
  toggleReversed: React.DispatchWithoutAction
  loading?: boolean
  hookAddress?: string
  poolApr?: Percent
  rewardsApr?: number
}

type RingTokenUnwrap = RingToken & { logoUrl?: string; isNative?: boolean }

export function PoolDetailsHeader({
  chainId,
  poolAddress,
  token0,
  token1,
  feeTier,
  protocolVersion,
  hookAddress,
  toggleReversed,
  loading,
  rewardsApr,
}: PoolDetailsHeaderProps) {
  const media = useMedia()
  const shouldColumnBreak = media.md
  const poolName = `${token0?.symbol} / ${token1?.symbol}`

  const { defaultChainId } = useEnabledChains()
  const ringTokens = useDefaultRingActiveTokens(chainId)
  const token0Info = Object.values(ringTokens).find(
    (item) => item.address.toLowerCase() === token0?.originToken?.address?.toLowerCase(),
  ) as any
  const token1Info = Object.values(ringTokens).find(
    (item) => item.address.toLowerCase() === token1?.originToken?.address?.toLowerCase(),
  ) as any
  const unwrapToken0 = unwrapFewToken(chainId ?? defaultChainId, token0, token0Info?.logoURI) as RingTokenUnwrap
  const unwrapToken1 = unwrapFewToken(chainId ?? defaultChainId, token1, token1Info?.logoURI) as RingTokenUnwrap

  const nativeLogo = getChainInfo(chainId ?? defaultChainId).nativeCurrency.logo

  const currencies = useMemo(
    () => (token0 && token1 ? [gqlToRingCurrency(token0 as RingToken), gqlToRingCurrency(token1 as RingToken)] : []),
    [token0, token1],
  )
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)
  const showRewards = isLPIncentivesEnabled && rewardsApr && rewardsApr > 0

  if (loading) {
    return (
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        width="100%"
        data-testid="pdp-header-loading-skeleton"
      >
        <Flex
          gap="$gap12"
          alignItems={shouldColumnBreak ? 'flex-start' : 'center'}
          row={!shouldColumnBreak}
          style={{ width: '100%' }}
        >
          <Shine>
            <Flex width={32} height={32} borderRadius="$roundedFull" backgroundColor="$surface3" />
          </Shine>
          <Shine>
            <Flex width={200} height={32} borderRadius="$rounded8" backgroundColor="$surface3" />
          </Shine>
        </Flex>
      </Flex>
    )
  }
  return (
    <Flex justifyContent="space-between" alignItems="flex-start" width="100%">
      {shouldColumnBreak ? (
        <Flex gap="$spacing4" width="100%">
          <Flex row gap="$spacing8" justifyContent="space-between">
            <DoubleCurrencyLogo currencies={currencies} data-testid="double-token-logo" />
            <PoolDetailsHeaderActions
              chainId={chainId}
              poolAddress={poolAddress}
              poolName={poolName}
              token0={token0}
              token1={token1}
              protocolVersion={protocolVersion}
            />
          </Flex>
          <PoolDetailsTitle
            token0={token0 as unknown as Token}
            token1={token1 as unknown as Token}
            chainId={chainId}
            feeTier={feeTier}
            protocolVersion={protocolVersion}
            toggleReversed={toggleReversed}
          />
          {showRewards && <LpIncentivesAprDisplay lpIncentiveRewardApr={rewardsApr} hideBackground />}
        </Flex>
      ) : (
        <Flex row gap={showRewards ? '$spacing16' : '$spacing12'} alignItems="center" width="100%">
          <PortfolioLogo
            data-testid="double-token-logo"
            images={[
              (unwrapToken0?.isNative ? nativeLogo : unwrapToken0?.logoUrl) as string,
              (unwrapToken1?.isNative ? nativeLogo : unwrapToken1?.logoUrl) as string,
            ]}
            chainId={chainId ?? defaultChainId}
            size={30}
          />
          <Flex flex={1}>
            <Flex row justifyContent="space-between" alignItems="center" width="100%">
              <PoolDetailsTitle
                token0={token0 as unknown as Token}
                token1={token1 as unknown as Token}
                chainId={chainId}
                feeTier={feeTier}
                protocolVersion={protocolVersion}
                toggleReversed={toggleReversed}
                hookAddress={hookAddress}
              />
              <PoolDetailsHeaderActions
                chainId={chainId}
                poolAddress={poolAddress}
                poolName={poolName}
                token0={token0}
                token1={token1}
                protocolVersion={protocolVersion}
              />
            </Flex>
            {showRewards && <LpIncentivesAprDisplay lpIncentiveRewardApr={rewardsApr} hideBackground />}
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
