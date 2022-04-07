export type SessionConnectedEvent = {
  session_id: string
  session_name: string
  account: string
}

export type SessionDisconnectedEvent = {
  session_id: string
  account: string
}

export enum WCEventType {
  SessionConnected = 'session_connected',
  SessionDisconnected = 'session_disconnected',
}
