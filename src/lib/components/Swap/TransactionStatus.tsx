import { useAtomValue } from 'jotai/utils'
import { ETH } from 'lib/mocks'
import styled, { icon } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { Clock } from 'react-feather'

import ActionButton from '../ActionButton'
import Column from '../Column'
import { Footer } from '../Dialog'
import Row from '../Row'
import Rule from '../Rule'
import SpinnerIcon from '../SpinnerIcon'
import { Input, swapAtom } from './state'
import { SwapSummary } from './Summary'

const Header = styled.div`
  display: flex;
  font-size: 64px;
  justify-content: center;
`

const ElapsedIcon = icon(Clock)

const TransactionStatusColumn = styled(Column)`
  height: 100%;
`

const EtherscanA = styled.a`
  color: ${({ theme }) => theme.active};
  text-decoration: none;
`

function useInput(input: Input): Required<Pick<Input, 'token' | 'value'>> {
  return {
    token: input.token || ETH,
    value: input.value || 123.4,
  }
}

export function TransactionStatusDialog() {
  const { input: partialInput, output: partialOutput } = useAtomValue(swapAtom)
  const input = useInput(partialInput)
  const output = useInput(partialOutput)

  return (
    <TransactionStatusColumn align="end">
      <Header>
        <SpinnerIcon />
      </Header>
      <Column gap={1} padded scrollable>
        <Column gap={1} flex>
          <TYPE.subhead1>Transaction pending</TYPE.subhead1>
          {input && output && <SwapSummary input={input} output={output} />}
        </Column>
        <Rule />
        <TYPE.subhead2 color="secondary">
          <Row>
            <Row gap={0.5}>
              <ElapsedIcon />3 min
            </Row>
            <EtherscanA href="//etherscan.io" target="_blank">
              View on Etherscan
            </EtherscanA>
          </Row>
        </TYPE.subhead2>
        <Footer>
          <ActionButton color="active" onClick={() => void 0}>
            Close
          </ActionButton>
        </Footer>
      </Column>
    </TransactionStatusColumn>
  )
}
