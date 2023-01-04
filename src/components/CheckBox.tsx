import { rgba } from 'polished'
import { ForwardedRef, InputHTMLAttributes, forwardRef } from 'react'
import styled from 'styled-components'

const CheckboxWrapper = styled.input`
  position: relative;
  transform: scale(1.35);
  accent-color: ${({ theme }) => theme.primary};

  :indeterminate::before {
    content: '';
    display: block;
    color: ${({ theme }) => theme.textReverse};
    width: 13px;
    height: 13px;
    background-color: ${({ theme }) => theme.primary};
    border-radius: 2px;
  }
  :indeterminate::after {
    content: '';
    display: block;
    width: 7px;
    height: 7px;
    border: solid ${({ theme }) => theme.textReverse};
    border-width: 2px 0 0 0;
    position: absolute;
    top: 5.5px;
    left: 3px;
  }

  :disabled {
    background-color: ${({ theme }) => theme.disableText};
  }
`

const CheckboxBorder = styled.input`
  -webkit-appearance: none;
  /* Remove most all native input styles */
  appearance: none;
  background-color: transparent;
  border-radius: 0.15em;
  display: grid;
  place-content: center;
  border: 2px solid ${({ theme }) => theme.text};
  ::before {
    content: '';
    width: 13px;
    height: 13px;
    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
    transform: scale(0);
    box-shadow: inset 1em 1em ${({ theme }) => theme.textReverse};
  }
  :checked {
    background-color: ${({ theme }) => theme.primary};
    border: none;
    ::before {
      transform: scale(1);
    }
  }
  :disabled {
    cursor: not-allowed;
    border-color: ${({ theme }) => rgba(theme.subText, 0.25)};
  }
`
interface Props extends InputHTMLAttributes<HTMLInputElement> {
  borderStyle?: boolean
}

const Checkbox = (params: Props, ref: ForwardedRef<HTMLInputElement>) => {
  if (params.borderStyle) return <CheckboxBorder type="checkbox" ref={ref} {...params} />
  return <CheckboxWrapper type="checkbox" ref={ref} {...params} />
}

export default forwardRef<HTMLInputElement, Props>(Checkbox)
