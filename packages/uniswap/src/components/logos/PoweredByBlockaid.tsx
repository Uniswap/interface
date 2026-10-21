import { isMobileApp } from '@universe/environment'
import { Flex, Text } from '@universe/mycelium'
import { Trans } from 'ui/src'
import { BlockaidLogo } from 'ui/src/components/logos/BlockaidLogo'

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
                minHeight={BLOCKAID_LOGO_HEIGHT}
                minWidth={BLOCKAID_LOGO_WIDTH}
                // Using the "size" prop does not work as expected for non-square icon like this one
                // Found that only specifying width fixes all alignment and size issues on mobile
                // display: web only — Tailwind preflight sets `svg { display: block }` app-wide,
                // which otherwise pushes the wordmark onto its own line inside this sentence
                {...(isMobileApp
                  ? { size: { width: BLOCKAID_LOGO_WIDTH } as { width: number; height: number } }
                  : { width: BLOCKAID_LOGO_WIDTH, height: BLOCKAID_LOGO_HEIGHT, display: 'inline' as const })}
                color="$neutral3"
              />
            ),
          }}
        />
      </Text>
    </Flex>
  )
}
