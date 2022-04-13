import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { ChevronDown } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'
import { useEffect, useMemo, useRef, useState } from 'react'

import Button from '../Button'
import Row from '../Row'
import TokenImg from '../TokenImg'

const StyledTokenButton = styled(Button)`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  padding: 0.25em;
  transition: width 0.125s ease-out;
`

const TokenButtonRow = styled(Row)<{ empty: boolean; collapsed: boolean }>`
  float: right;
  height: 1.2em;
  // max-width must have an absolute value in order to transition.
  max-width: ${({ collapsed }) => (collapsed ? '1.2em' : '12em')};
  padding-left: ${({ empty }) => empty && 0.5}em;
  width: fit-content;
  overflow: hidden;
  transition: max-width 0.25s linear;

  img {
    min-width: 1.2em;
  }
`

interface TokenButtonProps {
  value?: Currency
  collapsed: boolean
  disabled?: boolean
  onClick: () => void
}

export default function TokenButton({ value, collapsed, disabled, onClick }: TokenButtonProps) {
  const buttonBackgroundColor = useMemo(() => (value ? 'interactive' : 'accent'), [value])
  const contentColor = useMemo(() => (value || disabled ? 'onInteractive' : 'onAccent'), [value, disabled])

  // Transition the button if transitioning from a disabled state. This makes initialization cleaner.
  const button = useRef<HTMLButtonElement>(null)
  const [row, setRow] = useState<HTMLDivElement | null>(null)
  const empty = !value
  const [shouldTransition, setShouldTransition] = useState(true)
  useEffect(() => {
    if (disabled) {
      setShouldTransition(true)
    } else if (empty) {
      setShouldTransition(false)
    }
  }, [disabled, empty])
  const style = useMemo(() => {
    // Widths may only be transitioned using absolute values, so we must compute it.
    const width = row?.clientWidth
    return { width: shouldTransition && width ? width + 10 : undefined }
  }, [row, shouldTransition])

  return (
    <StyledTokenButton
      onClick={onClick}
      color={buttonBackgroundColor}
      disabled={disabled}
      bleedIn={shouldTransition}
      onAnimationEnd={() => setShouldTransition(false)}
      ref={button}
      style={style}
    >
      <ThemedText.ButtonLarge color={contentColor}>
        <TokenButtonRow gap={0.4} empty={empty} collapsed={collapsed} ref={setRow} key={value?.symbol}>
          {value ? (
            <>
              <TokenImg token={value} size={1.2} />
              {value.symbol}
            </>
          ) : (
            <Trans>Select a token</Trans>
          )}
          <ChevronDown color={contentColor} strokeWidth={3} />
        </TokenButtonRow>
      </ThemedText.ButtonLarge>
    </StyledTokenButton>
  )
}
