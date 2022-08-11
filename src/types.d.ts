declare type Address = string
declare type AddressTo<T> = Record<Address, T>
declare type NullUndefined<T> = T | null | undefined
declare type Nullable<T> = T | null
