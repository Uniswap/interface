import { PayloadActionCreator } from '@reduxjs/toolkit'
import { WritableAtom } from 'jotai'
import { selectAtom, useAtomValue, useUpdateAtom } from 'jotai/utils'
import { AnyAction } from 'redux'

export default function useSelectedReducerAtom<
  State,
  Value,
  Payload,
  Args extends any[] = Payload extends any[] ? Payload : Payload extends void ? [] : [Payload]
>(
  atom: WritableAtom<State, AnyAction>,
  selector: (state: State) => Value,
  action: PayloadActionCreator<Payload>
): [Value, (...updates: Args) => void] {
  const value = useAtomValue(selectAtom(atom, selector))
  const dispatch = useUpdateAtom(atom)
  return [value, (...args) => dispatch(action(args))]
}
