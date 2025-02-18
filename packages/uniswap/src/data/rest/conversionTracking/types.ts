export enum PlatformIdType {
  Google = 'gclid',
  Twitter = 'twclid',
  Reddit = 'rdt_cid',
  Persona3 = 'prsna_id',
}

export type ConversionLead = {
  id: string
  type: PlatformIdType
  timestamp: number
  executedEvents: TrackConversionArgs['eventId'][]
}

export type TrackConversionArgs = {
  platformIdType: PlatformIdType
  eventId: string
  eventName: string
}

export enum RequestType {
  POST = 'POST',
}

export type BuildProxyRequestArgs = {
  lead: ConversionLead
  address: Address
  eventId: string
  eventName: string
}
