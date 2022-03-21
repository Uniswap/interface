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

  // TODO(zzmp): TokenImg takes a frame to switch.
  const srcs = useCurrencyLogoURIs(tokenInfo)

  const [attempt, setAttempt] = useState(0)
  const onError = useCallback((e) => {
    if (e.target.src) badSrcs.add(e.target.src)
    setAttempt((attempt) => ++attempt)
  }, [])

  return useMemo(() => {
    // Trigger a re-render when an error occurs.
    void attempt

    const src = srcs.find((src) => !badSrcs.has(src))
    if (!src) return <MissingToken color="secondary" {...rest} />

    const alt = tokenInfo.name || tokenInfo.symbol
    return <img src={src} alt={alt} key={alt} onError={onError} {...rest} />
  }, [attempt, onError, rest, srcs, tokenInfo.name, tokenInfo.symbol])
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
