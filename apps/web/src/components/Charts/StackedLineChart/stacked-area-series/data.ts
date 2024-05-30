/* Copied from: https://github.com/tradingview/lightweight-charts/blob/f13a3c1f3fefcace9d4da5b97c1638009298b3c8/plugin-examples/src/plugins/stacked-area-series */
import { CustomData } from 'lightweight-charts'

/**
 * StackedArea Series Data
 */
export interface StackedAreaData extends CustomData {
  values: number[]
}
