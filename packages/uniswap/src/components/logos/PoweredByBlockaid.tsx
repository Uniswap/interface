import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { BlockaidLogo } from 'ui/src/components/logos/BlockaidLogo'
import { isMobileApp } from 'utilities/src/platform'

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
                {...(isMobileApp
                  ? { size: { width: BLOCKAID_LOGO_WIDTH } as { width: number; height: number } }
                  : { width: BLOCKAID_LOGO_WIDTH, height: BLOCKAID_LOGO_HEIGHT })}
                color="$neutral3"
              />
            ),
          }}
        />
      </Text>
    </Flex>
  )
}
