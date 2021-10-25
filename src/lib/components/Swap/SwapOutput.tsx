import ColorThief from 'colorthief'
import styled, { DynamicProvider as DynamicThemeProvider, useTheme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { ReactNode, useEffect, useRef, useState } from 'react'

import Column from '../Column'
import Row from '../Row'
import TokenInput, { TokenInputProps } from './TokenInput'

const thief = new ColorThief()

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
        const img = node.cloneNode() as HTMLImageElement
        img.src = src
        img.crossOrigin = 'anonymous'
        img.addEventListener('load', onLoad)
        return () => {
          img.removeEventListener('load', onLoad)
        }
      }
    }
    return () => void 0

    function onLoad(e: Event) {
      try {
        const [r, g, b] = thief.getColor(e.target)
        setColor(`#${r.toString(16)}${g.toString(16)}${b.toString(16)}`)
      } catch {}
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
