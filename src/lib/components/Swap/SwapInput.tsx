import { useAtomValue } from 'jotai/utils'
import { useUpdateAtom } from 'jotai/utils'
import styled, { icon } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { pickAtom } from 'lib/utils/atoms'
import { ReactNode } from 'react'
import { Book } from 'react-feather'

import { TextButton } from '../Button'
import Column from '../Column'
import Row from '../Row'
import { inputAtom, State, swapAtom } from './state'
import TokenInput from './TokenInput'

const BookIcon = icon(Book)

const InputColumn = styled(Column)`
  padding: 0.75em;
  position: relative;
`

export default function SwapInput({ children }: { children: ReactNode }) {
  const input = useAtomValue(inputAtom)
  const setValue = useUpdateAtom(pickAtom(inputAtom, 'value'))
  const setToken = useUpdateAtom(pickAtom(inputAtom, 'token'))
  const swap = useAtomValue(swapAtom)
  const balance = 123.45

  return (
    <InputColumn gap={0.75}>
      <Row>
        <TYPE.subhead3 color="secondary">Trading</TYPE.subhead3>
      </Row>
      <TokenInput
        input={input}
        disabled={swap.state === State.TOKEN_APPROVAL}
        onChangeInput={setValue}
        onChangeToken={setToken}
      >
        <TYPE.body2 color="secondary">
          <Row>
            {swap.input ? `~ $${swap.input.usdc.toLocaleString('en')}` : '-'}
            {balance && (
              <Row gap={0.5}>
                <Row gap={0.25}>
                  <BookIcon />
                  {balance}
                </Row>
                <TextButton onClick={() => setValue(balance)} disabled={!balance}>
                  Max
                </TextButton>
              </Row>
            )}
          </Row>
        </TYPE.body2>
      </TokenInput>
      <Row />
      {children}
    </InputColumn>
  )
}
