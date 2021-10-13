import { PayloadActionCreator } from '@reduxjs/toolkit'
import { WritableAtom } from 'jotai'
import { selectAtom, useAtomValue, useUpdateAtom } from 'jotai/utils'
import { AnyAction } from 'redux'

export default function useSelectedReducerAtom<State, Value, Payload>(
  atom: WritableAtom<State, AnyAction>,
  selector: (state: State) => Value,
  action: PayloadActionCreator<Payload>
): [
  Value,
  Payload extends any[]
    ? (...updates: Payload) => void
    : Payload extends void
    ? () => void
    : (...updates: [Payload]) => void
] {
  const value = useAtomValue(selectAtom(atom, selector))
  const dispatch = useUpdateAtom(atom)
  return [value, (...args: any[]) => dispatch(action(args))]
}
