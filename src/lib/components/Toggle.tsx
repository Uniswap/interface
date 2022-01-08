import { t } from '@lingui/macro'
import styled, { ThemedText } from 'lib/theme'
import { transparentize } from 'polished'
import { KeyboardEvent, useCallback } from 'react'

const Input = styled.input<{ text: string }>`
  -moz-appearance: none;
  -webkit-appearance: none;
  align-items: center;
  appearance: none;
  background: ${({ theme }) => theme.interactive};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius * 1.25}em;
  cursor: pointer;
  display: flex;
  font-size: inherit;
  font-weight: inherit;
  height: 2em;
  margin: 0;
  padding: 0;

  position: relative;
  width: 4.5em;

  :before {
    background-color: ${({ theme }) => theme.secondary};
    border-radius: ${({ theme }) => theme.borderRadius * 50}%;
    content: '';
    display: inline-block;
    height: 1.5em;
    margin-left: 0.25em;
    position: absolute;
    width: 1.5em;
  }

  :hover:before {
    background-color: ${({ theme }) => transparentize(0.3, theme.secondary)};
  }

  :checked:before {
    background-color: ${({ theme }) => theme.accent};
    margin-left: 2.75em;
  }

  :hover:checked:before {
    background-color: ${({ theme }) => transparentize(0.3, theme.accent)};
  }

  :after {
    content: '${({ text }) => text}';
    margin-left: 1.75em;
    text-align: center;
    width: 2.75em;
  }

  :checked:after {
    margin-left: 0;
  }

  :before {
    transition: margin 0.25s ease;
  }
`

interface ToggleProps {
  checked: boolean
  onToggle: () => void
}

export default function Toggle({ checked, onToggle }: ToggleProps) {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onToggle()
      }
    },
    [onToggle]
  )
  return (
    <ThemedText.ButtonMedium>
      <Input
        type="checkbox"
        checked={checked}
        text={checked ? t`ON` : t`OFF`}
        onChange={() => onToggle()}
        onKeyDown={onKeyDown}
      />
    </ThemedText.ButtonMedium>
  )
}
