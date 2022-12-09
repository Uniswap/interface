import { Search } from 'react-feather'
import styled, { CSSProperties } from 'styled-components'

import useTheme from 'hooks/useTheme'

const SearchContainer = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 999px;
  width: 320px;
  font-size: 12px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  > svg {
    cursor: pointer;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`

const Input = styled.input`
  outline: none;
  border: none;
  flex: 1;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.background};
  text-overflow: ellipsis;
  max-width: calc(100% - 20px);
  :placeholder {
    color: ${({ theme }) => theme.disableText};
  }
`
export default function SearchInput({
  value,
  maxLength = 255,
  onChange,
  placeholder,
  style = {},
  className,
}: {
  maxLength?: number
  placeholder: string
  value: string
  onChange: (val: string) => void
  style?: CSSProperties
  className?: string
}) {
  const theme = useTheme()
  return (
    <SearchContainer style={style} className={className}>
      <Input placeholder={placeholder} maxLength={maxLength} value={value} onChange={e => onChange(e.target.value)} />
      <Search color={theme.subText} size={16} style={{ minWidth: 16 }} />
    </SearchContainer>
  )
}
