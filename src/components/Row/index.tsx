import { Box } from 'rebass/styled-components'
import styled from 'styled-components/macro'

const Row = styled(Box)<{
  width?: string
  align?: string
  justify?: string
  padding?: string
  border?: string
  borderRadius?: string
}>`
  width: ${({ width }) => width ?? '100%'};
  display: flex;
  align-items: ${({ align }) => align ?? 'center'};
  justify-content: ${({ justify }) => justify ?? 'flex-start'};
  padding: ${({ padding }) => padding ?? 0};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius};
`

export const RowBetween = styled(Row)`
  justify-content: space-between;
`

export const RowFlat = styled.div`
  display: flex;
  align-items: flex-end;
`

export const AutoRow = styled(Row)<{ gap?: string; justify?: string; noWrap?: boolean }>`
  flex-wrap: ${({ noWrap }) => (noWrap ? 'nowrap' : 'wrap')};
  gap: ${({ gap }) => (gap === 'sm' && '8px') || (gap === 'md' && '12px') || (gap === 'lg' && '24px') || gap};
  justify-content: ${({ justify }) => justify && justify};

  & > * {
    gap: ${({ gap }) =>
      (gap === 'sm' && '8px') || (gap === 'md' && '12px') || (gap === 'lg' && '24px') || gap} !important;
  }
`

export const RowFixed = styled(Row)<{ gap?: string; justify?: string; width?: string }>`
  width: ${({ width }) => width || 'fit-content'};
  gap: ${({ gap }) => (gap === 'sm' && '8px') || (gap === 'md' && '12px') || (gap === 'lg' && '24px') || gap};
`

export default Row
