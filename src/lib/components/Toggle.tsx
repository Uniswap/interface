import styled, { Theme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { transparentize } from 'polished'
import { useCallback, useEffect, useRef } from 'react'

const Input = styled.input<{ text: string; theme: Theme }>`
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

  -webkit-appearance: none;
  -moz-appearance: none;

  :before {
    background-color: ${({ theme }) => theme.secondary};
    border-radius: ${({ theme }) => theme.borderRadius * 50}%;
    content: '';
    display: inline-block;
    height: 1.5em;
    margin-left: 0.25em;
    width: 1.5em;
    position: absolute;
  }

  :hover:before {
    background-color: ${({ theme }) => transparentize(0.3, theme.secondary)};
  }

  :checked:before {
    background-color: ${({ theme }) => theme.accent};

    // use margin because it can transition
    margin-left: 2.75em;
  }

  :hover:checked:before {
    background-color: ${({ theme }) => transparentize(0.3, theme.accent)};
  }

  :after {
    color: ${({ theme }) => theme.primary};
    content: '${({ text }) => text}';
    text-align: center;
    width: 2.75em;

    // use margin because it can transition
    margin-left: 1.75em;
  }

  :checked:after {
    margin-left: 0;
  }

  :before {
    transition: margin 0.15s ease;
  }
`

interface ToggleProps {
  checked: boolean
  onToggle: () => void
}

export default function Toggle({ checked, onToggle }: ToggleProps) {
  const input = useRef<HTMLInputElement>(null)
  const onKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onToggle()
      }
    },
    [onToggle]
  )
  useEffect(() => {
    console.log(input.current)
    const current = input.current
    current?.addEventListener('keydown', onKeydown, true)
    return () => current?.removeEventListener('keydown', onKeydown, true)
  }, [input, onKeydown])
  return (
    <TYPE.buttonMedium>
      <Input type="checkbox" checked={checked} text={checked ? 'ON' : 'OFF'} onChange={() => onToggle()} ref={input} />
    </TYPE.buttonMedium>
  )
}
