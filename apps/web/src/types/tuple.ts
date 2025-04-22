// From https://stackoverflow.com/a/67605309/1345206
// Used for slicing tuples (e.g. picking some subset of a param type)

type TupleSplit<T, N extends number, O extends readonly any[] = readonly []> = O['length'] extends N
  ? [O, T]
  : T extends readonly [infer F, ...infer R]
  ? TupleSplit<readonly [...R], N, readonly [...O, F]>
  : [O, T]

export type SkipFirst<T extends readonly any[], N extends number> = TupleSplit<T, N>[1]
