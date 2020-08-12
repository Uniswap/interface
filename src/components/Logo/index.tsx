import React, { useState } from 'react'
import styled from 'styled-components'

const BAD_URIS: { [tokenAddress: string]: true } = {}

const Image = styled.img`
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

/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback image
 * @param uris
 * @constructor
 */
export default function Logo({ uris, ...rest }: { uris: string[]; alt: string; style?: React.CSSProperties }) {
  const [, refresh] = useState<number>(0)

  const uri: string | undefined = uris.find(uri => !BAD_URIS[uri])

  if (uri) {
    return (
      <Image
        {...rest}
        src={uri}
        onError={() => {
          if (uri) BAD_URIS[uri] = true
          refresh(i => i + 1)
        }}
      />
    )
  }

  return (
    <Emoji {...rest}>
      <span role="img" aria-label="Thinking">
        🤔
      </span>
    </Emoji>
  )
}
