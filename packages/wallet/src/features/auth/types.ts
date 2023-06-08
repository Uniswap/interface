export enum AuthActionType {
  Unlock = 'unlock',
  Lock = 'lock',
}

export enum AuthSagaError {
  InvalidPassword = 'Invalid password',
}

export interface AuthBaseParams {
  type: AuthActionType
}

export interface UnlockParams extends AuthBaseParams {
  type: AuthActionType.Unlock
  password: string
}

export interface LockParams extends AuthBaseParams {
  type: AuthActionType.Lock
}
