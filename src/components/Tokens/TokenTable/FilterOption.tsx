//import { ReactNode } from 'react'
import styled from 'styled-components/macro'
import { OPACITY_HOVER, TRANSITION_TIME } from 'theme'

const FilterOption = styled.button<{ active: boolean; highlight?: boolean }>`
  height: 100%;
  color: ${({ theme, active }) => (active ? theme.accentActive : theme.textPrimary)};
  background-color: ${({ theme, active }) => (active ? theme.accentActiveSoft : theme.backgroundInteractive)};
  margin: 0;
  padding: 6px 12px 6px 14px;
  border-radius: 12px;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  transition: ${TRANSITION_TIME};
  border: none;
  outline: ${({ theme, active, highlight }) => (active && highlight ? `1px solid ${theme.accentAction}` : 'none')};

  :hover {
    cursor: pointer;
    background-color: ${({ theme, active }) => (active ? theme.accentActiveSoft : theme.backgroundModule)};
    opacity: ${({ active }) => (active ? OPACITY_HOVER : 1)};
  }
  :focus {
    background-color: ${({ theme, active }) => (active ? theme.accentActiveSoft : theme.backgroundInteractive)};
  }
`
export default FilterOption

// export default function FilterOption({
//   active,
//   onClick,
//   children,
// }: {
//   active: boolean
//   onClick: () => void
//   children: ReactNode
// }) {
//   return (
//     <StyledFilterButton onClick={onClick} active={active}>
//       {children}
//     </StyledFilterButton>
//   )
// }
