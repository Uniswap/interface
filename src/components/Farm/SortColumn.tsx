import { ButtonEmpty } from 'components/Button'
import styled, { useTheme } from 'styled-components/macro'

interface SortColumn {
  text: string
  index: string
  width: number
  justify?: string
  onClick: () => void
}

interface SortColumnsProps {
  sortColumns: SortColumn[]
  selectedSort: string
  sortDesc: boolean
}

const SortColumnsLayout = styled.div`
  display: flex;
  width: 90%;
  align-items: center;
  justify-content: space-evenly;
  margin-left: 20px;
`

export default function SortColumns({ sortColumns, selectedSort, sortDesc }: SortColumnsProps) {
  const theme = useTheme()

  return (
    <SortColumnsLayout>
      {sortColumns.map((item) => (
        <ButtonEmpty
          key={item.index}
          width="fit-content"
          justifyContent={item.justify}
          onClick={item.onClick}
          style={{
            color: theme.textSecondary,
          }}
        >
          <small className={selectedSort === item.index ? '' : 'text-secondary'}>{item.text}</small>
          {/* {selectedSort === item.index && !sortDesc ? <ChevronUp /> : <ChevronDown />} */}
        </ButtonEmpty>
      ))}
    </SortColumnsLayout>
  )
}
