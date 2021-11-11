import styled from 'lib/theme'

const Button = styled.button`
  background-color: transparent;
  border: none;
  border-radius: 0.5em;
  color: currentColor;
  cursor: pointer;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  margin: 0;
  padding: 0;

  :hover {
    opacity: 0.7;
  }

  :disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`

export default Button

export const TextButton = styled(Button)`
  color: ${({ theme }) => theme.accent};
`
