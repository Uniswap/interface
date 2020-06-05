import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { isAddress } from '../../utils'

function getTokenUrl(address: string): string {
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`
}

const BAD_IMAGES = {}

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

export const StyledEthereumLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`

export default function TokenLogo({
  address,
  size = '24px',
  ...rest
}: {
  address?: string
  size?: string
  style?: React.CSSProperties
}) {
  const [, setErrorCount] = useState<number>(0)

  const errorCallback = useCallback(() => {
    BAD_IMAGES[address] = true
    setErrorCount(count => count + 1)
  }, [address])

  let path = ''
  if (!BAD_IMAGES[address] && isAddress(address)) {
    path = getTokenUrl(address)
  } else {
    return (
      <Emoji {...rest} size={size}>
        <span role="img" aria-label="Thinking">
          🤔
        </span>
      </Emoji>
    )
  }

  return <Image {...rest} src={path} size={size} onError={errorCallback} />
}
