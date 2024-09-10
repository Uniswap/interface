import { SeriesDataItemTypeMap, SeriesOptionsMap, Time } from 'lightweight-charts'

export type SeriesDataItemType = SeriesDataItemTypeMap<Time>[keyof SeriesOptionsMap]
