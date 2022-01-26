import { RefObject } from 'react';
export declare const UNMOUNTING = "unmounting";
/**
 * Delays a node's unmounting so that an animation may be applied.
 * An animation *must* be applied, or the node will not unmount.
 */
export default function useUnmount(node: RefObject<HTMLElement>): void;
