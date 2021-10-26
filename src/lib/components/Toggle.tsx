import styled, { Theme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { transparentize } from 'polished'

const Input = styled.input<{ text: string; theme: Theme }>`
  align-items: center;
  appearance: none;
  background: ${({ theme }) => theme.interactive};
  border: none;
  border-radius: 1.25em;
  cursor: pointer;
  display: flex;
  font-family: inherit;
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
    border-radius: 1.5em;
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
    background-color: ${({ theme }) => theme.active};

    // use margin because it can transition
    margin-left: 2.75em;
  }

  :hover:checked:before {
    background-color: ${({ theme }) => transparentize(0.3, theme.active)};
  }

  :after {
    color: ${({ theme }) => theme.primary};
    content: '${({ text }) => text}';
    text-align: center;
    width: 2.75em;

    // use margin because it can transition
    margin-left: 28px;
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
  onToggle: (value: boolean) => void
}

export default function Toggle({ checked, onToggle }: ToggleProps) {
  return (
    <TYPE.buttonMedium>
      <Input
        type="checkbox"
        checked={checked}
        text={checked ? 'ON' : 'OFF'}
        onChange={({ target: { checked } }) => onToggle(checked)}
      />
    </TYPE.buttonMedium>
  )
}
