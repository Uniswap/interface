/**
 * The `FlexLoader` compat prop contract: the legacy surface
 * (`{ repeat?: number } & FlexProps & ViewProps`) carried on the compat `Flex`
 * prop model, so
 * `<FlexLoader borderRadius="$rounded12" height={24} width={100} />` call
 * sites convert as a mechanical barrel swap. The legacy `& ViewProps` half is
 * dropped: it added no surface the parity-verified `FlexCompatProps` doesn't
 * already carry.
 */
import type { FlexCompatProps } from '../flex-compat/props'

export type FlexLoaderProps = {
  /** How many placeholder blocks to stack. Default: 1. */
  repeat?: number
} & FlexCompatProps
