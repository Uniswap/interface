import { Percent } from '@uniswap/sdk-core'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from 'components/BreadcrumbNav'
import { DropdownSelector } from 'components/DropdownSelector'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { ExplorerIcon } from 'components/Icons/ExplorerIcon'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { DetailBubble } from 'components/Pools/PoolDetails/shared'
import { PoolDetailsBadge } from 'components/Pools/PoolTable/PoolTable'
import ShareButton from 'components/Tokens/TokenDetails/ShareButton'
import { ActionButtonStyle } from 'components/Tokens/TokenDetails/shared'
import { LoadingBubble } from 'components/Tokens/loading'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { getTokenDetailsURL, gqlToCurrency } from 'graphql/data/util'
import styled, { useTheme } from 'lib/styled-components'
import { ReversedArrowsIcon } from 'nft/components/icons'
import React, { useMemo, useState } from 'react'
import { ChevronRight, ExternalLink as ExternalLinkIcon } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ClickableStyle,
  ClickableTamaguiStyle,
  EllipsisStyle,
  ExternalLink,
  TamaguiClickableStyle,
  ThemedText,
} from 'theme/components'
import { textFadeIn } from 'theme/styles'
import { Flex, TouchableArea, useIsTouchDevice, useMedia } from 'ui/src'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { ProtocolVersion, Token } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { useFormatter } from 'utils/formatNumbers'

const StyledExternalLink = styled(ExternalLink)`
  &:hover {
    // Override hover behavior from ExternalLink
    opacity: 1;
  }
`

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: 'flex-start';
  width: 100%;
  ${textFadeIn};
  animation-duration: ${({ theme }) => theme.transition.duration.medium};
`

const IconBubble = styled(LoadingBubble)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
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
  const chainName = toGraphQLChain(chainId ?? defaultChainId)
  const exploreOrigin = `/explore/${chainName.toLowerCase()}`
  const poolsOrigin = `/explore/pools/${chainName.toLowerCase()}`

  return (
    <BreadcrumbNavContainer aria-label="breadcrumb-nav">
      <BreadcrumbNavLink to={exploreOrigin}>
        <Trans i18nKey="common.explore" /> <ChevronRight size={14} />
      </BreadcrumbNavLink>
      <BreadcrumbNavLink to={poolsOrigin}>
        <Trans i18nKey="common.pools" /> <ChevronRight size={14} />
      </BreadcrumbNavLink>
      {loading || !poolAddress ? (
        <DetailBubble $width={200} />
      ) : (
        <CurrentPageBreadcrumb address={poolAddress} poolName={`${token0?.symbol} / ${token1?.symbol}`} />
      )}
    </BreadcrumbNavContainer>
  )
}

const StyledPoolDetailsTitle = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: max-content;
  align-items: center;
`

const PoolName = styled(ThemedText.HeadlineMedium)`
  font-size: 24px !important;

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    font-size: 18px !important;
    line-height: 24px !important;
  }
`

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
  const { formatPercent } = useFormatter()
  const { defaultChainId } = useEnabledChains()
  const graphQLChain = toGraphQLChain(chainId ?? defaultChainId)
  const feePercent = feeTier && formatPercent(new Percent(feeTier, BIPS_BASE * 100))
  return (
    <StyledPoolDetailsTitle>
      <Flex>
        <PoolName>
          <StyledLink
            to={getTokenDetailsURL({
              address: token0?.address,
              chain: graphQLChain,
            })}
          >
            {token0?.symbol}
          </StyledLink>
          &nbsp;/&nbsp;
          <StyledLink
            to={getTokenDetailsURL({
              address: token1?.address,
              chain: graphQLChain,
            })}
          >
            {token1?.symbol}
          </StyledLink>
        </PoolName>
      </Flex>
      <Flex row gap="$gap4" alignItems="center">
        <PoolDetailsBadge variant="body3" $position="left">
          {protocolVersion?.toLowerCase()}
        </PoolDetailsBadge>
        {hookAddress && (
          <ExternalLink href={getExplorerLink(chainId ?? defaultChainId, hookAddress, ExplorerDataType.ADDRESS)}>
            <PoolDetailsBadge variant="body3" {...TamaguiClickableStyle}>
              {shortenAddress(hookAddress, 0)}
            </PoolDetailsBadge>
          </ExternalLink>
        )}
        {!!feePercent && (
          <PoolDetailsBadge variant="body3" $position="right">
            {feePercent}
          </PoolDetailsBadge>
        )}
      </Flex>
      <TouchableArea
        hoverable
        {...ClickableTamaguiStyle}
        onPress={toggleReversed}
        testID="toggle-tokens-reverse-arrows"
      >
        <ReversedArrowsIcon size="20px" color={theme.neutral2} />
      </TouchableArea>
    </StyledPoolDetailsTitle>
  )
}

const ContractsDropdownRowContainer = styled(Row)`
  align-items: center;
  text-decoration: none;
  cursor: pointer;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 8px;
  ${EllipsisStyle}
  &:hover {
    background: ${({ theme }) => theme.surface3};
  }
`

const ContractsDropdownRow = ({
  address,
  chainId,
  tokens,
}: {
  address?: string
  chainId?: number
  tokens: (Token | undefined)[]
}) => {
  const theme = useTheme()
  const currency = tokens[0] && gqlToCurrency(tokens[0])
  const isPool = tokens.length === 2
  const currencies = isPool && tokens[1] ? [currency, gqlToCurrency(tokens[1])] : [currency]
  const isNative = address === NATIVE_CHAIN_ID
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
            <DoubleCurrencyLogo currencies={currencies} size={24} />
          ) : (
            <CurrencyLogo currency={currency} size={24} />
          )}
          <ThemedText.BodyPrimary>
            {isPool ? <Trans i18nKey="common.pool" /> : tokens[0]?.symbol}
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
  token0?: Token
  token1?: Token
  protocolVersion?: ProtocolVersion
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isTouchDevice = useIsTouchDevice()
  const [contractsModalIsOpen, toggleContractsModal] = useState(false)

  return (
    <Row width="max-content" justify="flex-end" gap="sm">
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
            <ContractsDropdownRow address={poolAddress} chainId={chainId} tokens={[token0, token1]} />
          )}
          <ContractsDropdownRow address={token0?.address} chainId={chainId} tokens={[token0]} />
          <ContractsDropdownRow address={token1?.address} chainId={chainId} tokens={[token1]} />
        </>
      </DropdownSelector>
      <ShareButton name={poolName} utmSource="share-pool" />
    </Row>
  )
}

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.neutral1};
  text-decoration: none;
  ${ClickableStyle}
`

interface PoolDetailsHeaderProps {
  chainId?: number
  poolAddress?: string
  token0?: Token
  token1?: Token
  feeTier?: number
  protocolVersion?: ProtocolVersion
  toggleReversed: React.DispatchWithoutAction
  loading?: boolean
  hookAddress?: string
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
}: PoolDetailsHeaderProps) {
  const media = useMedia()
  const shouldColumnBreak = media.md
  const poolName = `${token0?.symbol} / ${token1?.symbol}`
  const currencies = useMemo(
    () => (token0 && token1 ? [gqlToCurrency(token0), gqlToCurrency(token1)] : []),
    [token0, token1],
  )

  if (loading) {
    return (
      <HeaderContainer data-testid="pdp-header-loading-skeleton">
        {shouldColumnBreak ? (
          <Column gap="sm" style={{ width: '100%' }}>
            <IconBubble />
            <DetailBubble $height={40} $width={137} />
          </Column>
        ) : (
          <Row gap="sm">
            <IconBubble />
            <DetailBubble $height={40} $width={137} />
          </Row>
        )}
      </HeaderContainer>
    )
  }
  return (
    <HeaderContainer>
      {shouldColumnBreak ? (
        <Column gap="sm" style={{ width: '100%' }}>
          <Row gap="md" justify="space-between">
            <DoubleCurrencyLogo currencies={currencies} data-testid="double-token-logo" />
            <PoolDetailsHeaderActions
              chainId={chainId}
              poolAddress={poolAddress}
              poolName={poolName}
              token0={token0}
              token1={token1}
              protocolVersion={protocolVersion}
            />
          </Row>
          <PoolDetailsTitle
            token0={token0}
            token1={token1}
            chainId={chainId}
            feeTier={feeTier}
            protocolVersion={protocolVersion}
            toggleReversed={toggleReversed}
          />
        </Column>
      ) : (
        <>
          <Row gap="md">
            <DoubleCurrencyLogo currencies={currencies} data-testid="double-token-logo" />
            <PoolDetailsTitle
              token0={token0}
              token1={token1}
              chainId={chainId}
              feeTier={feeTier}
              protocolVersion={protocolVersion}
              toggleReversed={toggleReversed}
              hookAddress={hookAddress}
            />
          </Row>
          <PoolDetailsHeaderActions
            chainId={chainId}
            poolAddress={poolAddress}
            poolName={poolName}
            token0={token0}
            token1={token1}
            protocolVersion={protocolVersion}
          />
        </>
      )}
    </HeaderContainer>
  )
}
