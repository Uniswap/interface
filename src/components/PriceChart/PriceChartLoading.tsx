import React from 'react'
import { Box } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { PriceChartLabel } from 'src/components/PriceChart/PriceChartLabels'
import { BUTTON_WIDTH } from 'src/components/PriceChart/PriceExplorer'
import { WIDTH } from 'src/components/PriceChart/utils'
import { Text } from 'src/components/Text'

export function PriceChartLoading() {
  return (
    <>
      <Box>
        <Loading type="price-header" />
      </Box>
      <Box my="lg">
        <Loading type="graph" />
      </Box>
      <Box alignSelf="center" flexDirection="row" width={WIDTH}>
        {Object.entries(PriceChartLabel).map(([_key, label]) => {
          return (
            <Box key={label} p="xxs" width={BUTTON_WIDTH}>
              <Text
                noTextScaling
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
