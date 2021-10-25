import styled, { DynamicProvider as DynamicThemeProvider, useTheme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import Vibrant from 'node-vibrant/lib/bundle'
import { ReactNode, useEffect, useRef, useState } from 'react'

import Column from '../Column'
import Row from '../Row'
import TokenInput, { TokenInputProps } from './TokenInput'

const OutputColumn = styled(Column)`
  background-color: ${({ theme }) => theme.module};
  border-radius: ${({ theme }) => theme.borderRadius - 0.25}em;
  padding: 0.75em;
  position: relative;
`

export default function SwapOutput({ children, ...props }: { children: ReactNode } & TokenInputProps) {
  const { module } = useTheme()
  const [color, setColor] = useState<string | undefined>()
  const ref = useRef<HTMLDivElement>(null)
  const { token } = props
  useEffect(() => {
    setColor(undefined)
    if (ref.current && token) {
      const node: HTMLImageElement | null = ref.current.querySelector(`img[src="${token.logoURI}"]`)
      if (node) {
        const src = node.src + '?_' // forces a different browser-cache for crossorigin requests
        Vibrant.from(src)
          .getPalette()
          .then((palette) => palette && palette.Vibrant?.hex)
          .then(setColor)
          .catch(() => void 0)
      }
    }
  }, [ref, token, module])
  return (
    <DynamicThemeProvider color={color}>
      <OutputColumn gap={0.75} ref={ref}>
        <Row>
          <TYPE.subhead3>For</TYPE.subhead3>
        </Row>
        <TokenInput {...props} />
        {children}
      </OutputColumn>
    </DynamicThemeProvider>
  )
}
