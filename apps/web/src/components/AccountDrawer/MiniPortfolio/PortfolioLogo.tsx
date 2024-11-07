import { Currency } from '@uniswap/sdk-core'
import blankTokenUrl from 'assets/svg/blank_token.svg'
import { ReactComponent as UnknownStatus } from 'assets/svg/contract-interaction.svg'
import Identicon from 'components/Identicon'
import { ChainLogo } from 'components/Logo/ChainLogo'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import {
  CircleLogoImage,
  DoubleCurrencyLogo,
  DoubleLogo,
  L2LogoContainer,
  SingleLogoContainer,
} from 'components/Logo/DoubleLogo'
import styled from 'lib/styled-components'
import React, { memo } from 'react'
import { Flex, SpinningLoader, styled as TamaguiStyled } from 'ui/src'
import { SUPPORTED_TESTNET_CHAIN_IDS, UniverseChainId } from 'uniswap/src/features/chains/types'

const UnknownContract = styled(UnknownStatus)`
  color: ${({ theme }) => theme.neutral2};
`

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  top: 0;
  left: 0;
`

interface PortfolioLogoProps {
  chainId: UniverseChainId
  accountAddress?: string
  currencies?: Array<Currency | undefined>
  images?: Array<string | undefined>
  size?: number
  style?: React.CSSProperties
  loading?: boolean
  customIcon?: React.ReactNode
}

function SquareL2Logo({ chainId, size }: { chainId: UniverseChainId; size: number }) {
  if (chainId === UniverseChainId.Mainnet) {
    return null
  }

  return (
    <L2LogoContainer $size={size}>
      <ChainLogo fillContainer={true} chainId={chainId} />
    </L2LogoContainer>
  )
}

const LOGO_DEFAULT_SIZE = 40

const AbsoluteCenteredElement = TamaguiStyled(Flex, {
  position: 'absolute',
  ml: 'auto',
  mr: 'auto',
  left: -4.5,
  top: -4.5,
})

// TODO(WEB-5111): Replace currency logos on web with uniswap currency logos
/**
 * Renders an image by prioritizing a list of sources, and then eventually a fallback contract icon
 */
export const PortfolioLogo = memo(function PortfolioLogo(props: PortfolioLogoProps) {
  if (SUPPORTED_TESTNET_CHAIN_IDS.includes(props.chainId)) {
    return <CurrencyLogo currency={props.currencies?.[0]} size={props.size} />
  }

  return (
    <LogoContainer style={props.style}>
      <Flex position="relative">
        {props.size && props.loading && (
          <AbsoluteCenteredElement>
            <SpinningLoader size={props.size + 6} width={2} />
          </AbsoluteCenteredElement>
        )}
        {getLogo(props)}
      </Flex>
      {props.customIcon ? (
        <Flex bottom={-4} position="absolute" right={-4}>
          {props.customIcon}
        </Flex>
      ) : (
        <SquareL2Logo chainId={props.chainId} size={props.size ?? LOGO_DEFAULT_SIZE} />
      )}
    </LogoContainer>
  )
})

function getLogo({ accountAddress, currencies, images, size = LOGO_DEFAULT_SIZE }: PortfolioLogoProps) {
  if (accountAddress) {
    return <Identicon account={accountAddress} size={size} />
  }
  if (images && images?.length >= 2) {
    return <DoubleLogo logo1={images[0]} logo2={images[images.length - 1]} size={size} />
  }
  if (currencies && currencies.length) {
    return <DoubleCurrencyLogo currencies={currencies} size={size} />
  }
  if (images?.length === 1) {
    return (
      <SingleLogoContainer size={size}>
        <CircleLogoImage size={size} src={images[0] ?? blankTokenUrl} />
      </SingleLogoContainer>
    )
  }
  return <UnknownContract width={size} height={size} />
}
