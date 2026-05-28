export enum KeyAction {
  UP = 'keyup',
  DOWN = 'keydown',
}

export type UseKeyDownProps = {
  callback: (e: KeyboardEvent) => void
  keys?: string[]
  keyAction?: KeyAction
  disabled?: boolean
  preventDefault?: boolean
  shouldTriggerInInput?: boolean
}
