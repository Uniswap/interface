import { t } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
import styled, { css } from 'styled-components'

import Search from 'components/Icons/Search'

const Wrapper = styled.div`
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;
  padding: 6px 12px;
  position: relative;
  display: flex;
  ${({ theme }) =>
    css`
      background-color: ${theme.background};
      color: ${theme.border};
    `}
`
const SearchInput = styled.input`
  border: none;
  outline: none;
  background-color: transparent;
  line-height: 18px;
  width: ${isMobile ? '120px' : '400px'};
  ${({ theme }) =>
    css`
      color: ${theme.subText};
      ::placeholder {
        color: ${theme.border};
      }
    `}
`
export default function SearchProposal({ search, setSearch }: { search?: string; setSearch?: (s: string) => void }) {
  return (
    <Wrapper>
      <SearchInput placeholder={t`Search proposals`} value={search} onChange={e => setSearch?.(e.target.value)} />
      <Search />
    </Wrapper>
  )
}
