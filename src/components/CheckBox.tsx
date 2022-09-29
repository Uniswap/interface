import styled from 'styled-components'

const Checkbox = styled.input`
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

export default Checkbox
