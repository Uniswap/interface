import type { ComponentProps, JSX } from 'react'
// oxlint-disable-next-line no-restricted-imports -- the one place the raw component is wrapped
import { Trans as UnescapedTrans } from 'react-i18next'

type TransProps = ComponentProps<typeof UnescapedTrans>

/**
 * `<Trans>` with every interpolated value HTML-escaped. react-i18next parses the interpolated string
 * as markup, so an unescaped value from the chain or the network (token symbol, ENS name, provider
 * name) can mint elements and attributes. Escaped values round-trip as text (`AT&T`, `<$0.01`).
 */
export function Trans({ tOptions, ...props }: TransProps): JSX.Element {
  return (
    <UnescapedTrans
      {...props}
      shouldUnescape
      tOptions={{ ...tOptions, interpolation: { ...tOptions?.interpolation, escapeValue: true } }}
    />
  )
}
