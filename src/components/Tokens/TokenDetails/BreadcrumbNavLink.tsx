import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const BreadcrumbNavLink = styled(Link)`
  display: flex;
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  line-height: 20px;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  margin-bottom: 16px;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  width: fit-content;

  &:hover {
    color: ${({ theme }) => theme.neutral3};
  }
`
