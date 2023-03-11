import { rgba } from 'polished'
import { AlertTriangle } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import useTheme from 'hooks/useTheme'
import { checkRangeSlippage } from 'utils/slippage'

const Wrapper = styled.div`
  padding: 12px 16px;

  display: flex;
  align-items: center;
  gap: 8px;

  border-radius: 999px;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => rgba(theme.warning, 0.3)};
  font-size: 12px;
`

const SlippageNote: React.FC = () => {
  const { slippage, isStablePairSwap } = useSwapFormContext()
  const { isValid, message } = checkRangeSlippage(slippage, isStablePairSwap)

  const theme = useTheme()
  if (!isValid || !message) {
    return null
  }

  return (
    <Wrapper>
      <Flex flex="0 0 16px" height="16px" alignItems="center" justifyContent="center">
        <AlertTriangle size={16} color={theme.warning} />
      </Flex>
      {message}
    </Wrapper>
  )
}

export default SlippageNote
