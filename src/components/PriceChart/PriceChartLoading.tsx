import React from 'react'
import { Box } from 'src/components/layout'
import { Loader } from 'src/components/loading'
import { PriceHeaderLoader } from 'src/components/loading/PriceHeaderLoader'
import { PriceChartLabel } from 'src/components/PriceChart/PriceChartLabels'
import { BUTTON_WIDTH } from 'src/components/PriceChart/PriceExplorer'
import { CHART_WIDTH } from 'src/components/PriceChart/utils'
import { Text } from 'src/components/Text'

export function PriceChartLoading() {
  return (
    <>
      <Box>
        <PriceHeaderLoader />
      </Box>
      <Box my="lg">
        <Loader.Graph />
      </Box>
      <Box alignSelf="center" flexDirection="row" width={CHART_WIDTH}>
        {Object.entries(PriceChartLabel).map(([_key, label]) => {
          return (
            <Box key={label} p="xxs" width={BUTTON_WIDTH}>
              <Text
                allowFontScaling={false}
                color="textTertiary"
                textAlign="center"
                variant="buttonLabelSmall">
                {label}
              </Text>
            </Box>
          )
        })}
      </Box>
    </>
  )
}
