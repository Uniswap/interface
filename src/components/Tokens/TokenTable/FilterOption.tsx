import styled from 'styled-components'
const FilterOption = styled.button<{ active: boolean; highlight?: boolean }>`
  height: 100%;
  color: ${({ theme, active }) => (active ? theme.neutral1 : theme.neutral1)};
  background-color: ${({ theme, active }) => (active ? theme.surface1 : theme.surface1)};
  margin: 0;
  padding: 6px 6px 6px 14px;
  border-radius: 12px;
  font-size: 16px;
  line-height: 24px;
  font-weight: 535;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  border: 1px solid ${({ theme }) => theme.surface3};
  outline: ${({ theme, active, highlight }) => (active && highlight ? `1px solid ${theme.accent1}` : 'none')};

  :hover {
    cursor: pointer;
    background-color: ${({ theme, active }) => (active ? theme.accent2 : theme.surface2)};
    opacity: ${({ theme, active }) => (active ? theme.opacity.hover : 1)};
  }
  :focus {
    background-color: ${({ theme, active }) => (active ? theme.surface2 : theme.surface3)};
  }
`
export default FilterOption
