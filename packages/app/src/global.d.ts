declare type Address = string
declare type AddressTo<T> = Record<Address, T>
declare type Maybe<T> = T | null | undefined
declare type Nullable<T> = T | null
declare type Primitive =
  | number
  | string
  | boolean
  | bigint
  | symbol
  | null
  | undefined

declare type ValuesOf<T extends readonly unknown[]> = T[number]
