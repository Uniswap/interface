import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { useEffect } from 'react'
import { usePrevious } from 'react-use'

import { useActiveWeb3React } from 'hooks'
import { Field } from 'state/swap/actions'
import { useUserAddedTokens } from 'state/user/hooks'

const useResetCurrenciesOnRemoveImportedTokens = (
  currencyIn: Currency | undefined,
  currencyOut: Currency | undefined,
  onResetSelectCurrency: (field: Field) => void,
) => {
  const { chainId } = useActiveWeb3React()
  const tokenImports: Token[] = useUserAddedTokens()
  const prevTokenImports = usePrevious(tokenImports)
  const addressIn = currencyIn?.wrapped?.address
  const addressOut = currencyOut?.wrapped?.address

  useEffect(() => {
    // when remove token imported
    if (!prevTokenImports) {
      return
    }

    const isRemoved = prevTokenImports?.length > tokenImports.length
    if (!isRemoved || prevTokenImports[0].chainId !== chainId) {
      return
    }

    // removed token => deselect input
    const tokenRemoved = prevTokenImports.filter(
      token => !tokenImports.find(token2 => token2.address === token.address),
    )

    const removedTokenAddresses = tokenRemoved.map(token => token.address)

    if (!addressIn || removedTokenAddresses.includes(addressIn)) {
      onResetSelectCurrency(Field.INPUT)
    }

    if (!addressOut || removedTokenAddresses.includes(addressOut)) {
      onResetSelectCurrency(Field.OUTPUT)
    }
  }, [addressIn, addressOut, chainId, onResetSelectCurrency, prevTokenImports, tokenImports])
}

export default useResetCurrenciesOnRemoveImportedTokens
