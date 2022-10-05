import { CrossIcon } from 'nft/components/icons'
import styled from 'styled-components/macro'

const TraitChipWrap = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px 8px 12px;
  font-weight: 600;

  border-radius: 12px;
  background-color: ${({ theme }) => theme.backgroundModule};
  font-size: 14px;
`

const CrossIconWrap = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  height: 28px;
  width: 28px;
  border: none;
`

export const TraitChip = ({ onClick, value }: { value: string; onClick: () => void }) => {
  return (
    <TraitChipWrap>
      <span>{value}</span>

      <CrossIconWrap onClick={onClick}>
        <CrossIcon style={{ marginTop: 2 }} cursor="pointer" />
      </CrossIconWrap>
    </TraitChipWrap>
  )
}
