import { Currency } from '@uniswap/sdk-core'
import { useToken } from 'lib/hooks/useCurrency'
import useCurrencyLogoURIs from 'lib/hooks/useCurrencyLogoURIs'
import { MissingToken } from 'lib/icons'
import styled from 'lib/theme'
import { useCallback, useMemo, useState } from 'react'

const badSrcs = new Set<string>()

interface BaseProps {
  token: Currency
}

type TokenImgProps = BaseProps & Omit<React.ImgHTMLAttributes<HTMLImageElement>, keyof BaseProps>

function TokenImg({ token, ...rest }: TokenImgProps) {
  // Use the wrapped token info so that it includes the logoURI.
  const tokenInfo = useToken(token.isToken ? token.wrapped.address : undefined) ?? token

  const srcs = useCurrencyLogoURIs(tokenInfo)

  const [attempt, setAttempt] = useState(0)
  const src = useMemo(() => {
    // Trigger a re-render when an error occurs.
    void attempt

    return srcs.find((src) => !badSrcs.has(src))
  }, [attempt, srcs])
  const onError = useCallback(
    (e) => {
      if (src) badSrcs.add(src)
      setAttempt((attempt) => ++attempt)
    },
    [src]
  )

  if (!src) return <MissingToken color="secondary" {...rest} />

  const alt = tokenInfo.name || tokenInfo.symbol
  return <img src={src} alt={alt} key={alt} onError={onError} {...rest} />
}

export default styled(TokenImg)<{ size?: number }>`
  // radial-gradient calculates distance from the corner, not the edge: divide by sqrt(2)
  background: radial-gradient(
    ${({ theme }) => theme.module} calc(100% / ${Math.sqrt(2)} - 1.5px),
    ${({ theme }) => theme.outline} calc(100% / ${Math.sqrt(2)} - 1.5px)
  );
  border-radius: 100%;
  height: ${({ size }) => size || 1}em;
  width: ${({ size }) => size || 1}em;
`
