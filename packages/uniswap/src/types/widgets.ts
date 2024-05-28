export enum WidgetType {
  TokenPrice = 'token-price',
}

export type WidgetEvent = {
  kind: string
  family: string
  change: 'added' | 'removed'
}
