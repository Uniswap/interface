export interface Farm {
  name: string
  icon: React.ReactNode
  id: string
  sort: number
}

export interface FarmsContext {
  farms: Farm[]
}
