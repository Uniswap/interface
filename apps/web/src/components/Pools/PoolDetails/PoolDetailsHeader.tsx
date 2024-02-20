import { t, Trans } from '@lingui/macro'
import { ChainId, Currency, Percent } from '@uniswap/sdk-core'
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
import { chainIdToBackendName, getTokenDetailsURL } from 'graphql/data/util'
import { Token } from 'graphql/thegraph/__generated__/types-and-hooks'
import { useCurrency } from 'hooks/Tokens'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useScreenSize } from 'hooks/useScreenSize'
import React, { useReducer, useRef } from 'react'
import { ChevronRight, ExternalLink as ExternalLinkIcon } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { ClickableStyle, EllipsisStyle, ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'
import { opacify } from 'theme/utils'
import { Z_INDEX } from 'theme/zIndex'
import { shortenAddress } from 'utilities/src/addresses'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { ReverseArrow } from 'components/Icons/ReverseArrow'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
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

const FeeTier = styled(ThemedText.LabelMicro)`
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
    <BreadcrumbNavContainer isInfoPDPEnabled aria-label="breadcrumb-nav">
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
  toggleReversed,
}: {
  token0?: Token
  token1?: Token
  chainId?: number
  feeTier?: number
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
              address: token0?.id,
              chain: chainIdToBackendName(chainId),
              isInfoExplorePageEnabled: true,
            })}
          >
            {token0?.symbol}
          </StyledLink>
          &nbsp;/&nbsp;
          <StyledLink
            to={getTokenDetailsURL({
              address: token1?.id,
              chain: chainIdToBackendName(chainId),
              isInfoExplorePageEnabled: true,
            })}
          >
            {token1?.symbol}
          </StyledLink>
        </PoolName>
      </div>
      {!!feePercent && <FeeTier>{feePercent}</FeeTier>}
      <ToggleReverseArrows data-testid="toggle-tokens-reverse-arrows" onClick={toggleReversed} />
    </StyledPoolDetailsTitle>
  )
}

const ContractsModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => theme.deprecated_deepShadow};

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.sm}px) {
    position: absolute;
    top: 40px;
    right: 0;
    min-width: 235px;
    padding: 8px;
    border-radius: 16px;
    z-index: ${Z_INDEX.dropdown};
    background: ${({ theme }) => theme.surface1};
    ${EllipsisStyle}
  }

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100vw;
    padding: 12px 16px;
    border-radius: 12px;
    background: ${({ theme }) => theme.surface2};
    border-radius: 12px;
    border: ${({ theme }) => `1px solid ${theme.surface3}`};
    z-index: ${Z_INDEX.modal};
  }
`

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
  const currencies = [useCurrency(tokens[0]?.id, chainId), useCurrency(tokens[1]?.id, chainId)]

  const isPool = tokens.length === 2
  const explorerUrl =
    chainId && address && getExplorerLink(chainId, address, isPool ? ExplorerDataType.ADDRESS : ExplorerDataType.TOKEN)

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
            <CurrencyLogo currency={currencies[0]} size="24px" />
          )}
          <ThemedText.BodyPrimary>{isPool ? <Trans>Pool</Trans> : tokens[0]?.symbol}</ThemedText.BodyPrimary>
          <ThemedText.BodySecondary>{shortenAddress(address)}</ThemedText.BodySecondary>
        </Row>
        <ExternalLinkIcon size="16px" stroke={theme.neutral2} />
      </ContractsDropdownRowContainer>
    </StyledExternalLink>
  )
}

const ActionButton = styled(Row)`
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  color: ${({ theme }) => theme.neutral1};
  background-color: ${({ theme }) => opacify(12, theme.neutral1)};
  width: max-content;
  ${ClickableStyle}
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
        <MouseoverTooltip text={t`Explorers`} placement="bottom" size={TooltipSize.Max}>
          <ActionButton onClick={toggleContractsModal}>
            {chainId === ChainId.MAINNET ? (
              <EtherscanLogo width="18px" height="18px" fill={theme.neutral1} />
            ) : (
              <ExplorerIcon width="18px" height="18px" stroke={theme.darkMode ? 'none' : theme.neutral1} />
            )}
          </ActionButton>
        </MouseoverTooltip>
        {contractsModalIsOpen && (
          <ContractsModalContainer>
            <ContractsDropdownRow address={poolAddress} chainId={chainId} tokens={[token0, token1]} />
            <ContractsDropdownRow address={token0?.id} chainId={chainId} tokens={[token0]} />
            <ContractsDropdownRow address={token1?.id} chainId={chainId} tokens={[token1]} />
          </ContractsModalContainer>
        )}
      </div>
      <MouseoverTooltip text={t`Share`} placement="bottom" size={TooltipSize.Max}>
        <ShareButton name={poolName} />
      </MouseoverTooltip>
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
  toggleReversed: React.DispatchWithoutAction
  loading?: boolean
}

export function PoolDetailsHeader({
  chainId,
  poolAddress,
  token0,
  token1,
  feeTier,
  toggleReversed,
  loading,
}: PoolDetailsHeaderProps) {
  const currencies = [useCurrency(token0?.id, chainId), useCurrency(token1?.id, chainId)]

  const screenSize = useScreenSize()
  const shouldColumnBreak = !screenSize['sm']
  const poolName = `${token0?.symbol} / ${token1?.symbol}`

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
            toggleReversed={toggleReversed}
          />
        </Column>
      ) : (
        <>
          <Row gap="md">
            {chainId && (
              <DoubleCurrencyAndChainLogo data-testid="double-token-logo" chainId={chainId} currencies={currencies} />
            )}
            <PoolDetailsTitle token0={token0} token1={token1} feeTier={feeTier} toggleReversed={toggleReversed} />
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
export function DoubleCurrencyAndChainLogo({
  chainId,
  currencies,
  size = 32,
}: {
  chainId: number
  currencies: Array<Currency | undefined>
  size?: number
}) {
  return (
    <StyledLogoParentContainer>
      <DoubleCurrencyLogo chainId={chainId} currencies={currencies} size={size} />
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

export function DoubleCurrencyLogo({
  chainId,
  currencies,
  size = 32,
}: {
  chainId: number
  currencies: Array<Currency | undefined>
  size?: number
}) {
  const [src, nextSrc] = useTokenLogoSource(currencies?.[0]?.wrapped.address, chainId, currencies?.[0]?.isNative)
  const [src2, nextSrc2] = useTokenLogoSource(currencies?.[1]?.wrapped.address, chainId, currencies?.[1]?.isNative)

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
