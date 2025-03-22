import { Currency } from '@uniswap/sdk-core'
import { ReactComponent as UnknownStatus } from 'assets/svg/contract-interaction.svg'
import Identicon from 'components/Identicon'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import styled from 'lib/styled-components'
import React, { memo } from 'react'
import { Flex } from 'ui/src'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
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
  customIcon?: React.ReactNode
}

const LOGO_DEFAULT_SIZE = 40

export const PortfolioLogo = memo(function PortfolioLogo(props: PortfolioLogoProps) {
  if (SUPPORTED_TESTNET_CHAIN_IDS.includes(props.chainId)) {
    return <CurrencyLogo currency={props.currencies?.[0]} size={props.size} />
  }

  return (
    <LogoContainer style={props.style}>
      <Flex position="relative">{getLogo(props)}</Flex>
    </LogoContainer>
  )
})

function getLogo({
  accountAddress,
  currencies,
  images,
  chainId,
  customIcon,
  size = LOGO_DEFAULT_SIZE,
}: PortfolioLogoProps) {
  if (accountAddress) {
    return <Identicon account={accountAddress} size={size} />
  }
  if (currencies && currencies.length) {
    return <DoubleCurrencyLogo currencies={currencies} size={size} customIcon={customIcon} />
  }
  if (images && images.length >= 2) {
    return (
      <SplitLogo
        inputLogoUrl={images[0]}
        outputLogoUrl={images[1]}
        inputCurrencyInfo={null}
        outputCurrencyInfo={null}
        chainId={chainId}
        size={size}
      />
    )
  }
  if (images && images.length === 1) {
    return <TokenLogo url={images[0]} size={size} chainId={chainId} />
  }
  return <UnknownContract width={size} height={size} />
}
