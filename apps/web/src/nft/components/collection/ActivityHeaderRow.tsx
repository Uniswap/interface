import { Text, View } from 'ui/src'
import { breakpoints } from 'ui/src/theme'

enum ColumnHeaders {
  Item = 'Item',
  Event = 'Event',
  Price = 'Price',
  By = 'By',
  To = 'To',
}

export const HeaderRow = () => {
  return (
    <>
      <style>
        {`
          .header-row {
            grid-template-columns: 2.5fr 1fr;
          }
          @media (min-width: ${breakpoints.md}px) {
            .header-row {
              grid-template-columns: 2fr 1.5fr 1fr;
            }
          }
          @media (min-width: ${breakpoints.lg}px) {
            .header-row {
              grid-template-columns: 1.75fr 1.4fr 1.1fr 1fr 1fr;
            }
          }
          @media (min-width: ${breakpoints.xl}px) {
            .header-row {
              grid-template-columns: 1.75fr 1.4fr 1.1fr 1fr 1fr;
            }
          }
          @media (min-width: ${breakpoints.xxl}px) {
            .header-row {
              grid-template-columns: 1.75fr 1.4fr 1.1fr 1fr 1fr 1fr;
            }
          }
        `}
      </style>
      <View
        $platform-web={{
          display: 'grid',
        }}
        pb="$padding8"
        px="$padding16"
        className="header-row"
        width="100%"
      >
        <Text variant="body3" color="$neutral2">
          {ColumnHeaders.Item}
        </Text>
        <Text variant="body3" color="$neutral2">
          {ColumnHeaders.Event}
        </Text>
        <Text variant="body3" color="$neutral2" $md={{ display: 'none' }}>
          {ColumnHeaders.Price}
        </Text>
        <Text variant="body3" color="$neutral2" $md={{ display: 'none' }}>
          {ColumnHeaders.By}
        </Text>
        <Text variant="body3" color="$neutral2" $md={{ display: 'none' }}>
          {ColumnHeaders.To}
        </Text>
      </View>
    </>
  )
}
