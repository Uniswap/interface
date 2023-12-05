import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components'

export const BreadcrumbNav = styled.div<{ isInfoTDPEnabled?: boolean }>`
  display: flex;
  color: ${({ theme }) => theme.neutral1};
  ${({ isInfoTDPEnabled }) =>
    isInfoTDPEnabled
      ? css`
          font-size: 16px;
          line-height: 24px;
        `
      : css`
          font-size: 14px;
          line-height: 20px;
        `}
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
  width: fit-content;
`

export const BreadcrumbNavLink = styled(Link)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.neutral2};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.neutral3};
  }
`
