import useNativeEvent from 'lib/hooks/useNativeEvent'
import useScrollbar from 'lib/hooks/useScrollbar'
import styled, { ThemedText } from 'lib/theme'
import { Token } from 'lib/types'
import {
  ComponentClass,
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
import { areEqual, FixedSizeList, FixedSizeListProps } from 'react-window'
import invariant from 'tiny-invariant'

import { BaseButton } from '../Button'
import Column from '../Column'
import Row from '../Row'
import TokenImg from '../TokenImg'

const TokenButton = styled(BaseButton)`
  border-radius: 0;
  outline: none;
  padding: 0.5em 0.75em;
`

const ITEM_SIZE = 56
type ItemData = Token[]
interface FixedSizeTokenList extends FixedSizeList<ItemData>, ComponentClass<FixedSizeListProps<ItemData>> {}
const TokenList = styled(FixedSizeList as unknown as FixedSizeTokenList)<{
  hover: number
  scrollbar?: ReturnType<typeof useScrollbar>
}>`
  ${TokenButton}[data-index='${({ hover }) => hover}'] {
    background-color: ${({ theme }) => theme.onHover(theme.module)};
  }

  ${({ scrollbar }) => scrollbar}
  overscroll-behavior: none; // prevent Firefox's bouncy overscroll effect (because it does not trigger the scroll handler)
`
const OnHover = styled.div<{ hover: number }>`
  background-color: ${({ theme }) => theme.onHover(theme.module)};
  height: ${ITEM_SIZE}px;
  left: 0;
  position: absolute;
  top: ${({ hover }) => hover * ITEM_SIZE}px;
  width: 100%;
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
      onClick={onEvent}
      onBlur={onEvent}
      onFocus={onEvent}
      onMouseMove={onEvent}
      onKeyDown={onEvent}
      ref={ref}
    >
      <ThemedText.Body1>
        <Row>
          <Row gap={0.5}>
            <TokenImg token={value} size={1.5} />
            <Column flex gap={0.125} align="flex-start">
              <ThemedText.Subhead1>{value.symbol}</ThemedText.Subhead1>
              <ThemedText.Caption color="secondary">{value.name}</ThemedText.Caption>
            </Column>
          </Row>
          1.234
        </Row>
      </ThemedText.Body1>
    </TokenButton>
  )
}

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

interface TokenOptionsHandle {
  onKeyDown: (e: KeyboardEvent) => void
  blur: () => void
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
    [hover, onSelect, tokens]
  )
  const blur = useCallback(() => setHover(-1), [])
  useImperativeHandle(ref, () => ({ onKeyDown, blur }), [blur, onKeyDown])

  const onClick = useCallback(({ token }: BubbledEvent) => token && onSelect(token), [onSelect])
  const onFocus = useCallback(({ index }: BubbledEvent) => {
    if (index !== undefined) {
      setHover(index)
      setFocused(true)
    }
  }, [])
  const onBlur = useCallback(() => setFocused(false), [])
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

  const [element, setElement] = useState<HTMLElement | null>(null)
  const scrollbar = useScrollbar(element, { padded: true })

  const onHover = useRef<HTMLDivElement>(null)
  // use native onscroll handler to capture Safari's bouncy overscroll effect
  useNativeEvent(element, 'scroll', (e) => {
    invariant(element)
    if (onHover.current) {
      // must be set synchronously to avoid jank (avoiding useState)
      onHover.current.style.marginTop = `${-element.scrollTop}px`
    }
  })

  return (
    <Column
      align="unset"
      grow
      onKeyDown={onKeyDown}
      onClick={onClick}
      onBlur={onBlur}
      onFocus={onFocus}
      onMouseMove={onMouseMove}
      style={{ overflow: 'hidden' }}
    >
      {/* OnHover is a workaround to Safari's incorrect (overflow: overlay) implementation */}
      <OnHover hover={hover} ref={onHover} />
      <AutoSizer disableWidth>
        {({ height }) => (
          <TokenList
            hover={hover}
            height={height}
            width="100%"
            itemCount={tokens.length}
            itemData={tokens}
            itemKey={itemKey}
            itemSize={ITEM_SIZE}
            className="scrollbar"
            ref={list}
            outerRef={setElement}
            scrollbar={scrollbar}
          >
            {ItemRow}
          </TokenList>
        )}
      </AutoSizer>
    </Column>
  )
})

export default TokenOptions
