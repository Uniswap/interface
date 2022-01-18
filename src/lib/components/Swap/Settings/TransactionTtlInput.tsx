import { Trans } from '@lingui/macro'
import { useAtom } from 'jotai'
import { TRANSACTION_TTL_DEFAULT, transactionTtlAtom } from 'lib/state/swap'
import styled, { ThemedText } from 'lib/theme'
import { useRef } from 'react'

import Column from '../../Column'
import { inputCss, IntegerInput } from '../../Input'
import Row from '../../Row'
import { Label } from './components'

const tooltip = <Trans>Your transaction will revert if it has been pending for longer than this period of time.</Trans>

const Input = styled(Row)`
  ${inputCss}
`

export default function TransactionTtlInput() {
  const [transactionTtl, setTransactionTtl] = useAtom(transactionTtlAtom)
  const input = useRef<HTMLInputElement>(null)
  return (
    <Column gap={0.75}>
      <Label name={<Trans>Transaction deadline</Trans>} tooltip={tooltip} />
      <ThemedText.Body1>
        <Input onClick={() => input.current?.focus()}>
          <IntegerInput
            placeholder={TRANSACTION_TTL_DEFAULT.toString()}
            value={transactionTtl}
            onChange={(value) => setTransactionTtl(value ?? 0)}
            ref={input}
          />
          <Trans>minutes</Trans>
        </Input>
      </ThemedText.Body1>
    </Column>
  )
}
