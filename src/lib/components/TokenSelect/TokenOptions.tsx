import { t } from '@lingui/macro'
import { prefetchColor } from 'lib/hooks/useColor'
import styled, { Theme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { Token } from 'lib/types'
import {
  CSSProperties,
  forwardRef,
  KeyboardEvent,
  memo,
  SyntheticEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { areEqual, FixedSizeList } from 'react-window'

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
`

const TokenImg = styled.img`
  border-radius: 100%;
  height: 1.25em;
  width: 1.25em;
`

interface TokenOptionProps {
  index: number
  value: Token
  style: CSSProperties
}

interface BubbledEvent extends SyntheticEvent {
  index?: number
  token?: Token
  ref?: HTMLButtonElement
}

function TokenOption({ index, value, style }: TokenOptionProps) {
  const ref = useRef<HTMLButtonElement>(null)
  // Annotate the event to be handled later instead of passing in handlers to avoid rerenders.
  // This prevents token logos from reloading and flashing on the screen.
  const onEvent = (e: BubbledEvent) => {
    e.index = index
    e.token = value
    e.ref = ref.current ?? undefined
  }
  return (
    <TokenButton
      data-index={index}
      style={style}
      onMouseDown={() => prefetchColor(value)}
      onClick={onEvent}
      onBlur={onEvent}
      onFocus={onEvent}
      onMouseMove={onEvent}
      onKeyDown={onEvent}
      ref={ref}
    >
      <TYPE.body1>
        <Row>
          <Row gap={0.5}>
            <TokenImg src={value.logoURI} alt={t`${value.name || value.symbol} logo`} />
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

type ItemData = Token[]
const itemKey = (index: number, tokens: ItemData) => tokens[index]?.address
const ItemRow = memo(function ItemRow({
  data: tokens,
  index,
  style,
}: {
  data: ItemData
  index: number
  style: CSSProperties
}) {
  return <TokenOption index={index} value={tokens[index]} style={style} />
},
areEqual)

const TokenOptionsColumn = styled(Column)<{ hover: number; theme: Theme }>`
  [data-index='${({ hover }) => hover}'] {
    background-color: ${({ theme }) => theme.interactive};
  }
`

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

  const onClick = useCallback(({ token }: BubbledEvent) => token && onSelect(token), [onSelect])
  const onFocus = useCallback(({ index }: BubbledEvent) => {
    if (index !== undefined) {
      setHover(index)
      setFocused(true)
    }
  }, [])
  const onMouseMove = useCallback(
    ({ index, ref }: BubbledEvent) => {
      if (index !== undefined) {
        setHover(index)
        if (focused) {
          ref?.focus()
        }
      }
    },
    [focused]
  )

  return (
    <TokenOptionsColumn
      hover={hover}
      align="unset"
      grow
      onKeyDown={onKeyDown}
      onClick={onClick}
      onBlur={() => setFocused(false)}
      onFocus={onFocus}
      onMouseMove={onMouseMove}
    >
      <AutoSizer disableWidth>
        {({ height }) => (
          <FixedSizeList
            height={height}
            width="100%"
            itemCount={tokens.length}
            itemData={tokens}
            itemKey={itemKey}
            itemSize={56}
            ref={list}
          >
            {ItemRow}
          </FixedSizeList>
        )}
      </AutoSizer>
    </TokenOptionsColumn>
  )
})

export default TokenOptions
