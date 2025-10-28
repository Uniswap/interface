import { getTokenDetailsURL, gqlToCurrency } from 'appGraphql/data/util'
import { Percent } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from 'components/BreadcrumbNav'
import { Dropdown } from 'components/Dropdowns/Dropdown'
import Row from 'components/deprecated/Row'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { ExplorerIcon } from 'components/Icons/ExplorerIcon'
import { FeeData } from 'components/Liquidity/Create/types'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { LpIncentivesAprDisplay } from 'components/LpIncentives/LpIncentivesAprDisplay'
import { DetailBubble } from 'components/Pools/PoolDetails/shared'
import ShareButton from 'components/Tokens/TokenDetails/ShareButton'
import { ActionButtonStyle } from 'components/Tokens/TokenDetails/shared'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import styled, { useTheme } from 'lib/styled-components'
import React, { useMemo, useState } from 'react'
import { ChevronRight, ExternalLink as ExternalLinkIcon } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components/Links'
import { ClickableTamaguiStyle, EllipsisTamaguiStyle } from 'theme/components/styles'
import { Flex, Shine, Text, TouchableArea, styled as tamaguiStyled, useIsTouchDevice, useMedia } from 'ui/src'
import { ArrowDownArrowUp } from 'ui/src/components/icons/ArrowDownArrowUp'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { getChainUrlParam } from 'utils/chainParams'

const StyledExternalLink = styled(ExternalLink)`
  &:hover {
    // Override hover behavior from ExternalLink
    opacity: 1;
  }
`

interface PoolDetailsBreadcrumbProps {
  chainId?: UniverseChainId
  poolAddress?: string
  token0?: GraphQLApi.Token
  token1?: GraphQLApi.Token
  loading?: boolean
}

export function PoolDetailsBreadcrumb({ chainId, poolAddress, token0, token1, loading }: PoolDetailsBreadcrumbProps) {
  const { defaultChainId } = useEnabledChains()
  const chainUrlParam = getChainUrlParam(chainId ?? defaultChainId)
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
        <CurrentPageBreadcrumb address={poolAddress} poolName={`${token0?.symbol} / ${token1?.symbol}`} />
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
  token0?: GraphQLApi.Token
  token1?: GraphQLApi.Token
  chainId?: UniverseChainId
  feeTier?: FeeData
  protocolVersion?: GraphQLApi.ProtocolVersion
  toggleReversed: React.DispatchWithoutAction
  hookAddress?: string
}) => {
  const { defaultChainId } = useEnabledChains()
  const graphQLChain = toGraphQLChain(chainId ?? defaultChainId)
  return (
    <Flex row gap="$spacing12" alignItems="center" width="max-content">
      <Flex row>
        <StyledLink
          to={getTokenDetailsURL({
            address: token0?.address,
            chain: graphQLChain,
          })}
        >
          <Text variant="heading1" fontSize={24} $md={{ variant: 'subheading1' }}>
            {token0?.symbol} /{' '}
          </Text>
        </StyledLink>
        <StyledLink
          to={getTokenDetailsURL({
            address: token1?.address,
            chain: graphQLChain,
          })}
        >
          <Text variant="heading1" fontSize={24} $md={{ variant: 'subheading1' }}>
            {token1?.symbol}
          </Text>
        </StyledLink>
      </Flex>
      <Flex row gap="$spacing2">
        <LiquidityPositionInfoBadges version={protocolVersion} v4hook={hookAddress} feeTier={feeTier} size="default" />
      </Flex>
      <TouchableArea
        hoverable
        {...ClickableTamaguiStyle}
        onPress={toggleReversed}
        testID="toggle-tokens-reverse-arrows"
      >
        <ArrowDownArrowUp size="$icon.20" color="$neutral2" />
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
  tokens: (GraphQLApi.Token | undefined)[]
}) => {
  const theme = useTheme()
  const currency = tokens[0] && gqlToCurrency(tokens[0])
  const isPool = tokens.length === 2
  const currencies = isPool && tokens[1] ? [currency, gqlToCurrency(tokens[1])] : [currency]
  const isNative = address === NATIVE_CHAIN_ID || !address
  const explorerUrl =
    chainId &&
    getExplorerLink({
      chainId,
      data: address,
      type: isNative ? ExplorerDataType.NATIVE : isPool ? ExplorerDataType.ADDRESS : ExplorerDataType.TOKEN,
    })

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
            <DoubleCurrencyLogo currencies={currencies} size={24} />
          ) : (
            <CurrencyLogo currency={currency} size={24} />
          )}
          <ThemedText.BodyPrimary>
            {isPool ? <Trans i18nKey="common.pool" /> : tokens[0]?.symbol}
          </ThemedText.BodyPrimary>
          <ThemedText.BodySecondary>{shortenAddress({ address })}</ThemedText.BodySecondary>
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
  token0?: GraphQLApi.Token
  token1?: GraphQLApi.Token
  protocolVersion?: GraphQLApi.ProtocolVersion
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isTouchDevice = useIsTouchDevice()
  const [contractsModalIsOpen, toggleContractsModal] = useState(false)

  return (
    <Row width="max-content" justify="flex-end" gap="sm">
      <Dropdown
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
          {protocolVersion !== GraphQLApi.ProtocolVersion.V4 && (
            <ContractsDropdownRow address={poolAddress} chainId={chainId} tokens={[token0, token1]} />
          )}
          <ContractsDropdownRow address={token0?.address} chainId={chainId} tokens={[token0]} />
          <ContractsDropdownRow address={token1?.address} chainId={chainId} tokens={[token1]} />
        </>
      </Dropdown>
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
  token0?: GraphQLApi.Token
  token1?: GraphQLApi.Token
  feeTier?: FeeData
  protocolVersion?: GraphQLApi.ProtocolVersion
  toggleReversed: React.DispatchWithoutAction
  loading?: boolean
  hookAddress?: string
  poolApr?: Percent
  rewardsApr?: number
}

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
  const currencies = useMemo(
    () => (token0 && token1 ? [gqlToCurrency(token0), gqlToCurrency(token1)] : []),
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
            token0={token0}
            token1={token1}
            chainId={chainId}
            feeTier={feeTier}
            protocolVersion={protocolVersion}
            toggleReversed={toggleReversed}
          />
          {showRewards && <LpIncentivesAprDisplay lpIncentiveRewardApr={rewardsApr} hideBackground />}
        </Flex>
      ) : (
        <Flex row gap={showRewards ? '$spacing16' : '$spacing12'} alignItems="center" width="100%">
          <DoubleCurrencyLogo size={showRewards ? 56 : 30} currencies={currencies} data-testid="double-token-logo" />
          <Flex flex={1}>
            <Flex row justifyContent="space-between" alignItems="center" width="100%">
              <PoolDetailsTitle
                token0={token0}
                token1={token1}
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
