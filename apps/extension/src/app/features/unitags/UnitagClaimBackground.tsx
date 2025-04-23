import { PropsWithChildren, useMemo } from 'react'
import { Flex, useIsDarkMode } from 'ui/src'
import {
  UNITAGS_ADRIAN_DARK,
  UNITAGS_ADRIAN_LIGHT,
  UNITAGS_ANDREW_DARK,
  UNITAGS_ANDREW_LIGHT,
  UNITAGS_BRYAN_DARK,
  UNITAGS_BRYAN_LIGHT,
  UNITAGS_CALLIL_DARK,
  UNITAGS_CALLIL_LIGHT,
  UNITAGS_FRED_DARK,
  UNITAGS_FRED_LIGHT,
  UNITAGS_MAGGIE_DARK,
  UNITAGS_MAGGIE_LIGHT,
  UNITAGS_PHIL_DARK,
  UNITAGS_PHIL_LIGHT,
  UNITAGS_SPENCER_DARK,
  UNITAGS_SPENCER_LIGHT,
} from 'ui/src/assets'
import { zIndexes } from 'ui/src/theme'
import { IconCloud } from 'uniswap/src/components/IconCloud/IconCloud'

export function UnitagClaimBackground({ children }: PropsWithChildren<{ blurAll: boolean }>): JSX.Element {
  const isDarkMode = useIsDarkMode()

  const unitags = useMemo(
    () =>
      isDarkMode
        ? [
            { logoUrl: UNITAGS_ADRIAN_DARK },
            { logoUrl: UNITAGS_ANDREW_DARK },
            { logoUrl: UNITAGS_BRYAN_DARK },
            { logoUrl: UNITAGS_CALLIL_DARK },
            { logoUrl: UNITAGS_FRED_DARK },
            { logoUrl: UNITAGS_MAGGIE_DARK },
            { logoUrl: UNITAGS_PHIL_DARK },
            { logoUrl: UNITAGS_SPENCER_DARK },
          ]
        : [
            { logoUrl: UNITAGS_ADRIAN_LIGHT },
            { logoUrl: UNITAGS_ANDREW_LIGHT },
            { logoUrl: UNITAGS_BRYAN_LIGHT },
            { logoUrl: UNITAGS_CALLIL_LIGHT },
            { logoUrl: UNITAGS_FRED_LIGHT },
            { logoUrl: UNITAGS_MAGGIE_LIGHT },
            { logoUrl: UNITAGS_PHIL_LIGHT },
            { logoUrl: UNITAGS_SPENCER_LIGHT },
          ],
    [isDarkMode],
  )

  return (
    <Flex centered height="100%" width="100%">
      <Flex centered height="100%" width="100%" zIndex={zIndexes.default}>
        {children}
      </Flex>

      <IconCloud data={unitags} minItemSize={150} maxItemSize={175} />
    </Flex>
  )
}
