declare type Address = string
declare type AddressTo<T> = Record<Address, T>

declare type Nullable<T> = T | null
declare type Maybe<T> = Nullable<T> | undefined

declare type Primitive = number | string | boolean | bigint | symbol | null | undefined

declare type ValuesOf<T extends readonly unknown[]> = T[number]

declare type ArrayOfLength<L extends number, T, Acc extends T[] = []> = Acc['length'] extends L
  ? Acc extends []
    ? L extends 0
      ? []
      : T[]
    : Acc
  : ArrayOfLength<L, T, [...Acc, T]>

declare type Require<T, K extends keyof T> = T & Required<Pick<T, K>>

declare type RequireNonNullable<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> }

// Utility type to create a range of numbers (inclusive of start but exclusive of end -- python style)
declare type NumberRange<
  Start extends number,
  End extends number,
  Acc extends number[] = []
> = Acc['length'] extends End ? Acc[number] : NumberRange<Start, End, [...Acc, Acc['length'] & number]>
