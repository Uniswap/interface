import { isMobileApp } from '@universe/environment'
import { Flex, Text } from '@universe/mycelium'
import { BlockaidLogo } from '@universe/mycelium/logos/BlockaidLogo'
import { Trans } from 'ui/src'

const BLOCKAID_LOGO_WIDTH = 50
const BLOCKAID_LOGO_HEIGHT = isMobileApp ? 13 : 10

export function PoweredByBlockaid(): JSX.Element {
  return (
    <Flex centered row gap="$spacing6">
      <Text variant="body3" color="$neutral3">
        <Trans
          i18nKey="common.poweredBy"
          components={{
            name: (
              <BlockaidLogo
                width={BLOCKAID_LOGO_WIDTH}
                height={BLOCKAID_LOGO_HEIGHT}
                // web only — Tailwind preflight sets `svg { display: block }` app-wide,
                // which otherwise pushes the wordmark onto its own line inside this sentence
                display={isMobileApp ? undefined : 'inline'}
                color="$neutral3"
              />
            ),
          }}
        />
      </Text>
    </Flex>
  )
}
