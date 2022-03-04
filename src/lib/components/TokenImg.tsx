import { Currency } from '@uniswap/sdk-core'
import useCurrencyLogoURIs from 'lib/hooks/useCurrencyLogoURIs'
import { MissingToken } from 'lib/icons'
import styled from 'lib/theme'
import { useCallback, useEffect, useState } from 'react'

const badSrcs = new Set<string>()

interface BaseProps {
  token: Currency
}

type TokenImgProps = BaseProps & Omit<React.ImgHTMLAttributes<HTMLImageElement>, keyof BaseProps>

function TokenImg({ token, ...rest }: TokenImgProps) {
  const srcs = useCurrencyLogoURIs(token)
  const [src, setSrc] = useState<string | undefined>()
  useEffect(() => {
    setSrc(srcs.find((src) => !badSrcs.has(src)))
  }, [srcs])
  const onError = useCallback(() => {
    if (src) badSrcs.add(src)
    setSrc(srcs.find((src) => !badSrcs.has(src)))
  }, [src, srcs])

  if (src) {
    return <img src={src} alt={token.name || token.symbol} onError={onError} {...rest} />
  }
  return <MissingToken color="secondary" {...rest} />
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
