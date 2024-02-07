import Row from 'components/Row'
import { Minus, Plus } from 'react-feather'
import styled from 'styled-components'
import { ClickableStyle } from 'theme/components'

const Container = styled(Row)`
  width: fit-content;
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.neutral2};
    background-color: ${({ theme }) => theme.surface3};
    border: 1px solid transparent;
    ${ClickableStyle}
    height: 24px;
    padding-bottom: 2px;
  }
`

const IncrementButton = styled.button`
  border-radius: 0px 999px 999px 0px;
  padding-right: 10px;
`

const DecrementButton = styled.button`
  padding-left: 10px;
  border-radius: 999px 0px 0px 999px;
`

export function LimitPriceIncrementButtons({
  onDecrement,
  onIncrement,
}: {
  onDecrement: () => void
  onIncrement: () => void
}) {
  return (
    <Container gap="1px">
      <DecrementButton onClick={onDecrement}>
        <Minus size={12} />
      </DecrementButton>
      <IncrementButton onClick={onIncrement}>
        <Plus size={12} />
      </IncrementButton>
    </Container>
  )
}
