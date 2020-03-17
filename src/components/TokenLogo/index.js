import React, { useState } from 'react'
import styled from 'styled-components'
import { isAddress } from '../../utils'
import { useWeb3React } from '../../hooks'
import { WETH } from '@uniswap/sdk'

import { ReactComponent as EthereumLogo } from '../../assets/images/ethereum-logo.svg'

const TOKEN_ICON_API = address =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${isAddress(
    address
  )}/logo.png`
const BAD_IMAGES = {}

const Image = styled.img`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background-color: white;
  border-radius: 1rem;
`

const Emoji = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ size }) => size};
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  margin-bottom: -4px;
`

const StyledEthereumLogo = styled(EthereumLogo)`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
`

export default function TokenLogo({ address, size = '24px', ...rest }) {
  const [error, setError] = useState(false)
  const { chainId } = useWeb3React()

  // hard code change to show ETH instead of WETH in UI
  if (address === WETH[chainId].address) {
    address = 'ETH'
  }

  // remove this just for testing
  if (address === isAddress('0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735')) {
    address = '0x6b175474e89094c44da98b954eedeac495271d0f'
  }

  let path = ''
  if (address === 'ETH') {
    return <StyledEthereumLogo size={size} {...rest} />
  } else if (!error && !BAD_IMAGES[address]) {
    path = TOKEN_ICON_API(address?.toLowerCase())
  } else {
    return (
      <Emoji {...rest} size={size}>
        <span role="img" aria-label="Thinking">
          🤔
        </span>
      </Emoji>
    )
  }

  return (
    <Image
      {...rest}
      // alt={address}
      src={path}
      size={size}
      onError={() => {
        BAD_IMAGES[address] = true
        setError(true)
      }}
    />
  )
}
