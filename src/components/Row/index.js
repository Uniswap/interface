import styled from 'styled-components'

const Row = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
`

export const RowBetween = styled(Row)`
  justify-content: space-between;
`

export const RowFlat = styled.div`
  display: flex;
  align-items: flex-end;
`

export const AutoRow = styled(Row)`
  flex-wrap: wrap;
  margin: -${({ gap }) => gap};

  & > * {
    margin: ${({ gap }) => gap} !important;
  }
`

export const RowFixed = styled(Row)`
  width: fit-content;
`

export default Row
