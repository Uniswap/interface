import { Draft } from 'immer';
import { WritableAtom } from 'jotai';
/**
 * Creates a derived atom whose value is the picked object property.
 * By default, the setter acts as a primitive atom's, changing the original atom.
 * A custom setter may also be passed, which uses an Immer Draft so that it may be mutated directly.
 */
export declare function pickAtom<Value, Key extends keyof Value & keyof Draft<Value>, Update>(anAtom: WritableAtom<Value, Value>, key: Key, setter: (draft: Draft<Value>[Key], update: Update) => Draft<Value>[Key]): WritableAtom<Value[Key], Update>;
export declare function pickAtom<Value, Key extends keyof Value & keyof Draft<Value>, Update extends Value[Key]>(anAtom: WritableAtom<Value, Value>, key: Key, setter?: (draft: Draft<Value>[Key], update: Update) => Draft<Value>[Key]): WritableAtom<Value[Key], Update>;
/** Sets a togglable atom to invert its state at the next render. */
export declare function setTogglable(draft: boolean): boolean;
