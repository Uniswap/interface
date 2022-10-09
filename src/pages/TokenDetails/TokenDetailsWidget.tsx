import { Currency } from '@uniswap/sdk-core'
import Widget, { Field, Tokens } from 'components/Widget'
import { chainIdToBackendName } from 'graphql/data/util'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function TokenDetailsWidget({
  token,
  onReviewSwap,
}: {
  token?: Currency
  onReviewSwap: () => Promise<boolean>
}) {
  const [tokens, setTokens] = useState<Tokens>({})

  // Update the Tokens to match the token on the TokenDetails page.
  useEffect(() => {
    if (tokens[Field.INPUT] === token || tokens[Field.OUTPUT] === token) return
    setTokens({ [Field.OUTPUT]: token })
  }, [tokens, token])

  // If the Tokens are changed and no longer include the token on the TokenDetails page,
  // navigate to the appropriate (updated) TokenDetails page.
  const navigate = useNavigate()
  const onTokensChange = useCallback(
    (tokens: Tokens) => {
      setTokens(tokens)
      if (tokens[Field.INPUT] === token || tokens[Field.OUTPUT] === token) return

      const update = tokens[Field.OUTPUT] || tokens[Field.INPUT]
      if (!update) return

      const network = chainIdToBackendName(update.chainId).toLowerCase()
      const address = update.isNative ? 'NATIVE' : update.address
      navigate(`/tokens/${network}/${address}`)
    },
    [navigate, token]
  )

  return <Widget tokens={tokens} onTokensChange={onTokensChange} onReviewSwapClick={onReviewSwap} />
}
