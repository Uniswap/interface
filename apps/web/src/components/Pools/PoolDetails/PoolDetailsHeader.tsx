import { t, Trans } from '@lingui/macro'
import { ChainId, Percent } from '@uniswap/sdk-core'
import blankTokenUrl from 'assets/svg/blank_token.svg'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from 'components/BreadcrumbNav'
import Column from 'components/Column'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { ExplorerIcon } from 'components/Icons/ExplorerIcon'
import { ChainLogo } from 'components/Logo/ChainLogo'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { LoadingBubble } from 'components/Tokens/loading'
import ShareButton from 'components/Tokens/TokenDetails/ShareButton'
import { StyledExternalLink } from 'components/Tokens/TokenDetails/TokenDetailsHeader'
import { BIPS_BASE } from 'constants/misc'
import { ProtocolVersion, Token } from 'graphql/data/__generated__/types-and-hooks'
import { chainIdToBackendName, getTokenDetailsURL, gqlToCurrency } from 'graphql/data/util'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useScreenSize } from 'hooks/useScreenSize'
import React, { useReducer, useRef } from 'react'
import { ChevronRight, ExternalLink as ExternalLinkIcon } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components'
import { ClickableStyle, EllipsisStyle, ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'
import { shortenAddress } from 'utilities/src/addresses'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { DropdownSelector } from 'components/DropdownSelector'
import { ReverseArrow } from 'components/Icons/ReverseArrow'
import { ActionButtonStyle, ActionMenuFlyoutStyle } from 'components/Tokens/TokenDetails/shared'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
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
  chainId?: number
  poolAddress?: string
  token0?: Token
  token1?: Token
  loading?: boolean
}

export function PoolDetailsBreadcrumb({ chainId, poolAddress, token0, token1, loading }: PoolDetailsBreadcrumbProps) {
  const chainName = chainIdToBackendName(chainId)
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
  chainId?: number
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
              chain: chainIdToBackendName(chainId),
            })}
          >
            {token0?.symbol}
          </StyledLink>
          &nbsp;/&nbsp;
          <StyledLink
            to={getTokenDetailsURL({
              address: token1?.address,
              chain: chainIdToBackendName(chainId),
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
            <DoubleTokenAndChainLogo chainId={chainId} tokens={tokens} size={24} />
          ) : (
            <CurrencyLogo currency={currency} size="24px" />
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
  const tokens = [token0, token1]

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
            {chainId && <DoubleTokenAndChainLogo data-testid="double-token-logo" chainId={chainId} tokens={tokens} />}
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
            {chainId && <DoubleTokenAndChainLogo data-testid="double-token-logo" chainId={chainId} tokens={tokens} />}
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

const StyledLogoParentContainer = styled.div`
  position: relative;
  top: 0;
  left: 0;
`
export function DoubleTokenAndChainLogo({
  chainId,
  tokens,
  size = 32,
}: {
  chainId: number
  tokens: Array<Token | undefined>
  size?: number
}) {
  return (
    <StyledLogoParentContainer>
      <DoubleTokenLogo chainId={chainId} tokens={tokens} size={size} />
      <SquareL2Logo chainId={chainId} size={size} />
    </StyledLogoParentContainer>
  )
}

const L2_LOGO_SIZE_FACTOR = 3 / 8

const L2LogoContainer = styled.div<{ size: number }>`
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 2px;
  width: ${({ size }) => size * L2_LOGO_SIZE_FACTOR}px;
  height: ${({ size }) => size * L2_LOGO_SIZE_FACTOR}px;
  left: 60%;
  position: absolute;
  top: 60%;
  outline: 2px solid ${({ theme }) => theme.surface1};
  display: flex;
  align-items: center;
  justify-content: center;
`

function SquareL2Logo({ chainId, size }: { chainId: ChainId; size: number }) {
  if (chainId === ChainId.MAINNET) return null

  return (
    <L2LogoContainer size={size}>
      <ChainLogo chainId={chainId} size={size * L2_LOGO_SIZE_FACTOR} />
    </L2LogoContainer>
  )
}

export function DoubleTokenLogo({
  chainId,
  tokens,
  size = 32,
}: {
  chainId: number
  tokens: Array<Token | undefined>
  size?: number
}) {
  const token0IsNative = tokens?.[0]?.address === NATIVE_CHAIN_ID
  const token1IsNative = tokens?.[1]?.address === NATIVE_CHAIN_ID
  const [src, nextSrc] = useTokenLogoSource({
    address: tokens?.[0]?.address,
    chainId,
    primaryImg: token0IsNative ? undefined : tokens?.[0]?.project?.logo?.url,
    isNative: token0IsNative,
  })
  const [src2, nextSrc2] = useTokenLogoSource({
    address: tokens?.[1]?.address,
    chainId,
    primaryImg: token1IsNative ? undefined : tokens?.[1]?.project?.logo?.url,
    isNative: token1IsNative,
  })

  return <DoubleLogo logo1={src} onError1={nextSrc} logo2={src2} onError2={nextSrc2} size={size} />
}

const DoubleLogoContainer = styled.div<{ size: number }>`
  display: flex;
  gap: 2px;
  position: relative;
  top: 0;
  left: 0;
  img {
    width: ${({ size }) => size / 2}px;
    height: ${({ size }) => size}px;
    object-fit: cover;
  }
  img:first-child {
    border-radius: ${({ size }) => `${size / 2}px 0 0 ${size / 2}px`};
    object-position: 0 0;
  }
  img:last-child {
    border-radius: ${({ size }) => `0 ${size / 2}px ${size / 2}px 0`};
    object-position: 100% 0;
  }
`

const CircleLogoImage = styled.img<{ size: number }>`
  width: ${({ size }) => size / 2}px;
  height: ${({ size }) => size}px;
  border-radius: 50%;
`

interface DoubleLogoProps {
  logo1?: string
  logo2?: string
  onError1?: () => void
  onError2?: () => void
  size: number
}

function DoubleLogo({ logo1, onError1, logo2, onError2, size }: DoubleLogoProps) {
  return (
    <DoubleLogoContainer size={size}>
      <CircleLogoImage src={logo1 ?? blankTokenUrl} onError={onError1} size={size} />
      <CircleLogoImage src={logo2 ?? blankTokenUrl} onError={onError2} size={size} />
    </DoubleLogoContainer>
  )
}
