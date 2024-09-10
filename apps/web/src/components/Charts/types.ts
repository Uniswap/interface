import { SeriesDataItemTypeMap, SeriesOptionsMap, Time } from 'lightweight-charts'

export type SeriesDataItemType = SeriesDataItemTypeMap<Time>[keyof SeriesOptionsMap]

export const PROTOCOL_LEGEND_ELEMENT_ID = 'protocolGraphLegend'
