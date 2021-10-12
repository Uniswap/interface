import themed from '../themed'

const Input = themed.input`
  align-items: center;
  appearance: none;
  background: ${({ theme }) => theme.icon};
  border: none;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  height: 32px;
  margin: 0;
  outline: none;
  padding: 0;
  position: relative;
  width: 72px;

  -webkit-appearance: none;
  -moz-appearance: none;

  :before {
    background-color: ${({ theme }) => theme.text};
    border-radius: 24px;
    content: '';
    display: inline-block;
    height: 24px;
    margin: 4px;
    opacity: ${({ theme }) => theme.accentOpacity};
    width: 24px;
    position: absolute;
  }

  :checked:before {
    background-color: ${({ theme }) => theme.selected};
    margin-left: 44px;
    opacity: 1;
  }

  :after {
    color: ${({ theme }) => theme.text};
    content: 'OFF';
    margin-left: 28px;
    opacity: ${({ theme }) => theme.accentOpacity};
    text-align: center;
    width: 44px;
  }

  :checked:after {
    content: 'ON';
    margin-left: 0;
    opacity: 1;
  }

  :before {
    transition: margin ease 150ms;
  }
`

interface ToggleProps {
  checked: boolean
  onToggle: (value: boolean) => void
}

export default function Toggle({ checked, onToggle }: ToggleProps) {
  return <Input type="checkbox" checked={checked} onChange={({ target: { checked } }) => onToggle(checked)} />
}
