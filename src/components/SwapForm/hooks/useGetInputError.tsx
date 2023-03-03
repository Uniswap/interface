import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'

import { BAD_RECIPIENT_ADDRESSES } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import { isAddress } from 'utils'

type Args = {
  typedValue: string
  recipient: string | null | undefined
  parsedAmountFromTypedValue: CurrencyAmount<Currency> | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
}
const useGetInputError = (args: Args): string | undefined => {
  const { typedValue, recipient, currencyIn, currencyOut, parsedAmountFromTypedValue: parsedAmount, balanceIn } = args
  const { account, chainId } = useActiveWeb3React()

  const recipientLookup = useENS(recipient ?? undefined)
  const to = (recipient === null || recipient === '' ? account : recipientLookup.address) ?? null

  let inputError: string | undefined
  if (!account) {
    inputError = t`Connect wallet`
  }

  if (!parsedAmount) {
    if (typedValue) inputError = inputError ?? t`Invalid amount`
    else inputError = inputError ?? t`Enter an amount`
  }

  if (!currencyIn || !currencyOut) {
    inputError = inputError ?? t`Select a token`
  }

  const formattedTo = isAddress(chainId, to)
  if (!to || !formattedTo) {
    inputError = inputError ?? t`Enter a recipient`
  } else {
    if (BAD_RECIPIENT_ADDRESSES.indexOf(formattedTo) !== -1) {
      inputError = inputError ?? t`Invalid recipient`
    }
  }

  if (parsedAmount && ((balanceIn && balanceIn.lessThan(parsedAmount)) || !balanceIn)) {
    inputError = t`Insufficient ${parsedAmount.currency.symbol} balance`
  }

  return inputError
}

export default useGetInputError
