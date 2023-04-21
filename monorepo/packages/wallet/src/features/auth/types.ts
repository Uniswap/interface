export enum AuthType {
  Password = 'password',
}

export type AuthParams = {
  type: AuthType
  password: string
}
