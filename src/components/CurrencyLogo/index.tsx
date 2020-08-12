import React, { useState } from 'react'
import styled from 'styled-components'
import { Currency, Token, ETHER } from 'dxswap-sdk'

import EthereumLogo from '../../assets/images/ethereum-logo.png'
import { WrappedTokenInfo } from '../../state/lists/hooks'
import uriToHttp from '../../utils/uriToHttp'

const getTokenLogoURL = address =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`
const BAD_URIS: { [tokenAddress: string]: true } = {}

const Image = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
`

const Emoji = styled.span<{ size?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ size }) => size};
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  margin-bottom: -4px;
`

const StyledEthereumLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`

export default function CurrencyLogo({
  currency,
  size = '24px',
  ...rest
}: {
  currency?: Currency
  size?: string
  style?: React.CSSProperties
}) {
  const [, refresh] = useState<number>(0)

  if (currency === ETHER) {
    return <StyledEthereumLogo src={EthereumLogo} size={size} {...rest} />
  }

  if (currency instanceof Token) {
    let uri: string | undefined

    if (currency instanceof WrappedTokenInfo) {
      if (currency.logoURI && !BAD_URIS[currency.logoURI]) {
        uri = uriToHttp(currency.logoURI).filter(s => !BAD_URIS[s])[0]
      }
    }

    if (!uri) {
      const defaultUri = getTokenLogoURL(currency.address)
      if (!BAD_URIS[defaultUri]) {
        uri = defaultUri
      }
    }
    
    if (currency.address == "0xDd25BaE0659fC06a8d00CD06C7f5A98D71bfB715") {
      uri = "https://gateway.pinata.cloud/ipfs/QmPhoeL14E5SBFBaC4bA3nuRpg3MpxdWVYdPrdXHdQ3EHY/brand/dxdao-blue.png"
    }

    if (uri) {
      return (
        <Image
          {...rest}
          alt={`${currency.name} Logo`}
          src={uri}
          size={size}
          onError={() => {
            if (currency instanceof Token) {
              BAD_URIS[uri] = true
            }
            refresh(i => i + 1)
          }}
        />
      )
    }
  }

  return (
    <Emoji {...rest} size={size}>
      <span role="img" aria-label="Thinking">
        🤔
      </span>
    </Emoji>
  )
}
