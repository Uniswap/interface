import { prefetchColor } from 'lib/hooks/useColor'
import styled from 'lib/theme'
import TYPE from 'lib/theme/type'
import { Token } from 'lib/types'
import { Component, useEffect, useRef } from 'react'

import Button from '../Button'
import Column from '../Column'
import Row from '../Row'

const TokenButton = styled(Button)`
  border-radius: 0;
  outline: none;
  padding: 0.5em 0.75em;

  :first-of-type {
    padding-top: 1em;
  }

  :hover {
    opacity: 1;
  }

  :focus {
    background-color: ${({ theme }) => theme.interactive};
  }
`

const TokenImg = styled.img`
  border-radius: 100%;
  height: 1.25em;
  width: 1.25em;
`

interface TokenOptionProps {
  value: Token
  onClick: (value: Token) => void
}

function TokenOption({ value, onClick }: TokenOptionProps) {
  const ref = useRef<HTMLButtonElement>(null)
  // TODO: Use React's events, not native events, throughout
  useEffect(() => {
    const current = ref.current
    // preventScroll does not work in Safari
    const focus = () => current?.focus({ preventScroll: true })
    const tab = (e: KeyboardEvent) => {
      const prev = current?.previousElementSibling as HTMLElement | null
      const next = current?.nextElementSibling as HTMLElement | null
      if (e.key === 'ArrowUp') {
        prev?.focus()
      } else if (e.key === 'ArrowDown') {
        next?.focus()
      }
    }
    current?.addEventListener('mousemove', focus)
    current?.addEventListener('keydown', tab)
    return () => {
      current?.removeEventListener('mouseover', focus)
      current?.removeEventListener('keydown', tab)
    }
  })
  return (
    <TokenButton onClick={() => onClick(value)} onMouseDown={() => prefetchColor(value)} ref={ref}>
      <TYPE.body1>
        <Row>
          <Row gap={0.5}>
            <TokenImg src={value.logoURI} alt={`${value.name || value.symbol} logo`} />
            <Column flex align="flex-start">
              <TYPE.subhead1>{value.symbol}</TYPE.subhead1>
              <TYPE.caption color="secondary">{value.name}</TYPE.caption>
            </Column>
          </Row>
          1.234
        </Row>
      </TYPE.body1>
    </TokenButton>
  )
}

interface TokenOptionsProps {
  tokens: Token[]
  onSelect: (token: Token) => void
}

export default class TokenOptions extends Component<TokenOptionsProps> {
  render() {
    return (
      <Column scrollable>
        {this.props.tokens &&
          this.props.tokens.map((token) => (
            <TokenOption value={token} onClick={this.props.onSelect} key={token.address} />
          ))}
      </Column>
    )
  }
}
