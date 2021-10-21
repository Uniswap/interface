import styled from 'lib/theme'

const Button = styled.button`
  background-color: transparent;
  border: none;
  border-radius: 0.5em;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
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
