import { prefetchColor } from 'lib/hooks/useColor'
import styled, { Theme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { Token } from 'lib/types'
import {
  ElementRef,
  ForwardedRef,
  forwardRef,
  KeyboardEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import Button from '../Button'
import Column from '../Column'
import Row from '../Row'

const TokenButton = styled(Button)<{ focus: boolean; theme: Theme }>`
  background-color: ${({ focus, theme }) => focus && theme.interactive};
  border-radius: 0;
  outline: none;
  padding: 0.5em 0.75em;

  :first-of-type {
    padding-top: 1em;
  }

  :hover {
    opacity: 1;
  }
`

const TokenImg = styled.img`
  border-radius: 100%;
  height: 1.25em;
  width: 1.25em;
`

interface TokenOptionProps {
  value: Token
  focus: boolean
  onClick: (value: Token) => void
  onKeyDown: (e: KeyboardEvent) => void
  onFocus: (value: Token) => void
}

const TokenOption = forwardRef(function TokenOption(
  { value, focus, onClick, onKeyDown, onFocus }: TokenOptionProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  return (
    <TokenButton
      focus={focus}
      onClick={() => onClick(value)}
      onFocus={() => onFocus(value)}
      onKeyDown={onKeyDown}
      onMouseMove={() => onFocus(value)}
      onMouseDown={() => prefetchColor(value)}
      ref={ref}
    >
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
})

interface TokenOptionsHandle {
  onKeyDown: (e: KeyboardEvent) => void
}

interface TokenOptionsProps {
  tokens: Token[]
  onSelect: (token: Token) => void
}

const TokenOptions = forwardRef<TokenOptionsHandle, TokenOptionsProps>(function TokenOptions(
  { tokens, onSelect }: TokenOptionsProps,
  ref
) {
  const options = useRef<Array<ElementRef<typeof TokenOption> | null>>([])
  const [focus, setFocus] = useState(-1)
  useEffect(() => setFocus(-1), [tokens])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (e.key === 'ArrowDown' && focus < tokens.length - 1) {
          scrollTo(focus + 1)
        } else if (e.key === 'ArrowUp' && focus > 0) {
          scrollTo(focus - 1)
        } else if (e.key === 'ArrowUp' && focus === -1) {
          scrollTo(tokens.length - 1)
        }
        e.preventDefault()
      }
      if (e.key === 'Enter' && focus) {
        onSelect(tokens[focus])
      }

      function scrollTo(i: number) {
        setFocus(i)
        options.current[i]?.scrollIntoView({ block: 'nearest' })
        if (e.target === options.current[focus]) {
          options.current[i]?.focus()
        }
      }
    },
    [focus, onSelect, tokens, options]
  )
  useImperativeHandle(ref, () => ({ onKeyDown }), [onKeyDown])

  options.current = []
  return (
    <Column scrollable>
      {tokens &&
        tokens.map((token, i) => (
          <TokenOption
            focus={i === focus}
            value={token}
            onClick={onSelect}
            onFocus={() => setFocus(i)}
            onKeyDown={onKeyDown}
            key={token.address}
            ref={(ref) => (options.current[i] = ref)}
          />
        ))}
    </Column>
  )
})

export default TokenOptions
