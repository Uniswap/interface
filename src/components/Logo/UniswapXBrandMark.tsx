import { Trans } from '@lingui/macro'
import { ThemedText } from 'theme'

import UniswapXRouterLabel, { UnswapXRouterLabelProps } from '../RouterLabel/UniswapXRouterLabel'

type UniswapXBrandMarkProps = Omit<UnswapXRouterLabelProps, 'children' | 'fontWeight'> & {
  fontWeight?: 'bold'
}

export default function UniswapXBrandMark({ fontWeight, ...props }: UniswapXBrandMarkProps): JSX.Element {
  return (
    <UniswapXRouterLabel {...props}>
      <ThemedText.BodySecondary
        fontSize="inherit"
        {...(fontWeight === 'bold' && {
          fontWeight: '500',
        })}
      >
        <Trans>UniswapX</Trans>
      </ThemedText.BodySecondary>
    </UniswapXRouterLabel>
  )
}
