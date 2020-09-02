export interface Farm {
  name: string
  icon: React.ReactNode
  home: string
  id: string
  sort: number
  highlight: boolean
}

export interface FarmsContext {
  farms: Farm[]
}
