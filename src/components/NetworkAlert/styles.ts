import styled from 'styled-components/macro'
import { ExternalLink } from 'theme'

export const ReadMoreLink = styled(ExternalLink)`
  align-items: center;
  color: ${({ theme }) => theme.text1};
  display: flex;
  justify-content: center;
  text-decoration: underline;

  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  display: flex;
  font-size: 16px;
  height: 44px;
  justify-content: space-between;
  margin: 0 0 20px 0;
  padding: 12px 16px;
  text-decoration: none;
  width: auto;
  :hover,
  :focus,
  :active {
    background-color: rgba(255, 255, 255, 0.05);
  }
  transition: background-color 150ms ease-in-out;
`
