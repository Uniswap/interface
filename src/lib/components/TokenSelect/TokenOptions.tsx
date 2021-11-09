import { prefetchColor } from 'lib/hooks/useColor'
import styled, { Theme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { Token } from 'lib/types'
import {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  KeyboardEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'

import Button from '../Button'
import Column from '../Column'
import Row from '../Row'

const TokenButton = styled(Button)<{ hovered: boolean; theme: Theme }>`
  background-color: ${({ hovered, theme }) => hovered && theme.interactive};
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
  hovered: boolean
  style: CSSProperties
  onHover: () => void
  onFocus: () => void
  onClick: () => void
  onKeyDown: (e: KeyboardEvent) => void
}

const TokenOption = forwardRef(function TokenOption(
  { value, hovered, style, onHover, onClick, onFocus, onKeyDown }: TokenOptionProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  return (
    <TokenButton
      hovered={hovered}
      style={style}
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onMouseMove={onHover}
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
  const [focused, setFocused] = useState(false)
  const [hover, setHover] = useState(-1)
  useEffect(() => setHover(-1), [tokens])

  const list = useRef<FixedSizeList>(null)
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (e.key === 'ArrowDown' && hover < tokens.length - 1) {
          scrollTo(hover + 1)
        } else if (e.key === 'ArrowUp' && hover > 0) {
          scrollTo(hover - 1)
        } else if (e.key === 'ArrowUp' && hover === -1) {
          scrollTo(tokens.length - 1)
        }
        e.preventDefault()
      }
      if (e.key === 'Enter' && hover) {
        onSelect(tokens[hover])
      }

      function scrollTo(index: number) {
        list.current?.scrollToItem(index)
        setHover(index)
      }
    },
    [hover, tokens, onSelect]
  )
  useImperativeHandle(ref, () => ({ onKeyDown }), [onKeyDown])

  const itemKey = useCallback(({ index }) => tokens[index]?.address, [tokens])
  const div = useRef<HTMLDivElement>(null)

  return (
    <div
      style={{ height: '100%' }}
      onFocus={() => setFocused(true)}
      onBlur={(e) =>
        setFocused((e.relatedTarget instanceof HTMLElement && div.current?.contains(e.relatedTarget)) ?? false)
      }
      ref={div}
    >
      <AutoSizer disableWidth>
        {({ height }) => (
          <FixedSizeList
            height={height}
            width="100%"
            itemCount={tokens.length}
            itemKey={itemKey}
            itemSize={56}
            ref={list}
          >
            {({ index, style }) => (
              <TokenOption
                value={tokens[index]}
                hovered={index === hover}
                onHover={() => setHover(index)}
                onFocus={() => {
                  list.current?.scrollToItem(index)
                  setHover(index)
                }}
                onClick={() => onSelect(tokens[index])}
                onKeyDown={(e) => onKeyDown(e)}
                style={style}
                ref={index === hover && focused ? (ref) => ref?.focus() : undefined}
              />
            )}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  )
})

export default TokenOptions
