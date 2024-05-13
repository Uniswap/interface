import { ChainId, Percent } from '@uniswap/sdk-core'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from 'components/BreadcrumbNav'
import Column from 'components/Column'
import { DropdownSelector } from 'components/DropdownSelector'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { ExplorerIcon } from 'components/Icons/ExplorerIcon'
import { ReverseArrow } from 'components/Icons/ReverseArrow'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import ShareButton from 'components/Tokens/TokenDetails/ShareButton'
import { StyledExternalLink } from 'components/Tokens/TokenDetails/TokenDetailsHeader'
import { ActionButtonStyle, ActionMenuFlyoutStyle } from 'components/Tokens/TokenDetails/shared'
import { LoadingBubble } from 'components/Tokens/loading'
import { BIPS_BASE } from 'constants/misc'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { getTokenDetailsURL, gqlToCurrency } from 'graphql/data/util'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useScreenSize } from 'hooks/useScreenSize'
import { Trans, t } from 'i18n'
import React, { useMemo, useReducer, useRef } from 'react'
import { ChevronRight, ExternalLink as ExternalLinkIcon } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components'
import { ClickableStyle, EllipsisStyle, ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'
import { ProtocolVersion, Token } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { shortenAddress } from 'utilities/src/addresses'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { DoubleCurrencyAndChainLogo } from 'components/DoubleLogo'
import { SupportedInterfaceChainId, chainIdToBackendChain } from 'constants/chains'
import { useFormatter } from 'utils/formatNumbers'
import { DetailBubble } from './shared'

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: 'flex-start';
  width: 100%;
  ${textFadeIn};
  animation-duration: ${({ theme }) => theme.transition.duration.medium};
`

const Badge = styled(ThemedText.LabelMicro)`
  background: ${({ theme }) => theme.surface2};
  padding: 2px 6px;
  border-radius: 4px;
`

const ToggleReverseArrows = styled(ReverseArrow)`
  ${ClickableStyle}
  fill: ${({ theme }) => theme.neutral2};
`

const IconBubble = styled(LoadingBubble)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
`

interface PoolDetailsBreadcrumbProps {
  chainId?: SupportedInterfaceChainId
  poolAddress?: string
  token0?: Token
  token1?: Token
  loading?: boolean
}

export function PoolDetailsBreadcrumb({ chainId, poolAddress, token0, token1, loading }: PoolDetailsBreadcrumbProps) {
  const chainName = chainIdToBackendChain({ chainId, withFallback: true })
  const exploreOrigin = `/explore/${chainName.toLowerCase()}`
  const poolsOrigin = `/explore/pools/${chainName.toLowerCase()}`

  return (
    <BreadcrumbNavContainer aria-label="breadcrumb-nav">
      <BreadcrumbNavLink to={exploreOrigin}>
        <Trans>Explore</Trans> <ChevronRight size={14} />
      </BreadcrumbNavLink>
      <BreadcrumbNavLink to={poolsOrigin}>
        <Trans>Pools</Trans> <ChevronRight size={14} />
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

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
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
}: {
  token0?: Token
  token1?: Token
  chainId?: SupportedInterfaceChainId
  feeTier?: number
  protocolVersion?: ProtocolVersion
  toggleReversed: React.DispatchWithoutAction
}) => {
  const { formatPercent } = useFormatter()
  const feePercent = feeTier && formatPercent(new Percent(feeTier, BIPS_BASE * 100))
  return (
    <StyledPoolDetailsTitle>
      <div>
        <PoolName>
          <StyledLink
            to={getTokenDetailsURL({
              address: token0?.address,
              chain: chainIdToBackendChain({ chainId, withFallback: true }),
            })}
          >
            {token0?.symbol}
          </StyledLink>
          &nbsp;/&nbsp;
          <StyledLink
            to={getTokenDetailsURL({
              address: token1?.address,
              chain: chainIdToBackendChain({ chainId, withFallback: true }),
            })}
          >
            {token1?.symbol}
          </StyledLink>
        </PoolName>
      </div>
      {protocolVersion === ProtocolVersion.V2 && <Badge>v2</Badge>}
      {!!feePercent && <Badge>{feePercent}</Badge>}
      <ToggleReverseArrows data-testid="toggle-tokens-reverse-arrows" onClick={toggleReversed} />
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
      isNative ? ExplorerDataType.NATIVE : isPool ? ExplorerDataType.ADDRESS : ExplorerDataType.TOKEN
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
            <DoubleCurrencyAndChainLogo chainId={chainId} currencies={currencies} size={24} />
          ) : (
            <CurrencyLogo currency={currency} size={24} />
          )}
          <ThemedText.BodyPrimary>{isPool ? <Trans>Pool</Trans> : tokens[0]?.symbol}</ThemedText.BodyPrimary>
          <ThemedText.BodySecondary>{shortenAddress(address)}</ThemedText.BodySecondary>
        </Row>
        <ExternalLinkIcon size="16px" stroke={theme.neutral2} />
      </ContractsDropdownRowContainer>
    </StyledExternalLink>
  )
}

const ContractsModalContainer = css`
  ${ActionMenuFlyoutStyle}
  min-width: 235px;
  border-radius: 16px;
  ${EllipsisStyle}
`

const PoolDetailsHeaderActions = ({
  chainId,
  poolAddress,
  poolName,
  token0,
  token1,
}: {
  chainId?: number
  poolAddress?: string
  poolName: string
  token0?: Token
  token1?: Token
}) => {
  const theme = useTheme()

  const [contractsModalIsOpen, toggleContractsModal] = useReducer((s) => !s, false)
  const contractsRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(contractsRef, contractsModalIsOpen ? toggleContractsModal : undefined)

  return (
    <Row width="max-content" justify="flex-end" gap="sm">
      <div style={{ position: 'relative' }} ref={contractsRef}>
        <DropdownSelector
          isOpen={contractsModalIsOpen}
          toggleOpen={toggleContractsModal}
          menuLabel={
            chainId === ChainId.MAINNET ? (
              <EtherscanLogo width="18px" height="18px" fill={theme.neutral1} />
            ) : (
              <ExplorerIcon width="18px" height="18px" fill={theme.neutral1} />
            )
          }
          internalMenuItems={
            <>
              <ContractsDropdownRow address={poolAddress} chainId={chainId} tokens={[token0, token1]} />
              <ContractsDropdownRow address={token0?.address} chainId={chainId} tokens={[token0]} />
              <ContractsDropdownRow address={token1?.address} chainId={chainId} tokens={[token1]} />
            </>
          }
          tooltipText={t`Explorers`}
          hideChevron
          buttonCss={ActionButtonStyle}
          menuFlyoutCss={ContractsModalContainer}
        />
      </div>
      <ShareButton name={poolName} />
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
}

export function PoolDetailsHeader({
  chainId,
  poolAddress,
  token0,
  token1,
  feeTier,
  protocolVersion,
  toggleReversed,
  loading,
}: PoolDetailsHeaderProps) {
  const screenSize = useScreenSize()
  const shouldColumnBreak = !screenSize['sm']
  const poolName = `${token0?.symbol} / ${token1?.symbol}`
  const currencies = useMemo(
    () => (token0 && token1 ? [gqlToCurrency(token0), gqlToCurrency(token1)] : []),
    [token0, token1]
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
            {chainId && (
              <DoubleCurrencyAndChainLogo data-testid="double-token-logo" chainId={chainId} currencies={currencies} />
            )}
            <PoolDetailsHeaderActions
              chainId={chainId}
              poolAddress={poolAddress}
              poolName={poolName}
              token0={token0}
              token1={token1}
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
            {chainId && (
              <DoubleCurrencyAndChainLogo data-testid="double-token-logo" chainId={chainId} currencies={currencies} />
            )}
            <PoolDetailsTitle
              token0={token0}
              token1={token1}
              chainId={chainId}
              feeTier={feeTier}
              protocolVersion={protocolVersion}
              toggleReversed={toggleReversed}
            />
          </Row>
          <PoolDetailsHeaderActions
            chainId={chainId}
            poolAddress={poolAddress}
            poolName={poolName}
            token0={token0}
            token1={token1}
          />
        </>
      )}
    </HeaderContainer>
  )
}
