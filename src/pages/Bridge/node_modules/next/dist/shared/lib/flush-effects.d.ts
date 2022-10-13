import React from 'react';
export declare type FlushEffectsHook = (callbacks: () => React.ReactNode) => void;
export declare const FlushEffectsContext: React.Context<FlushEffectsHook | null>;
export declare function useFlushEffects(callback: () => React.ReactNode): void;
