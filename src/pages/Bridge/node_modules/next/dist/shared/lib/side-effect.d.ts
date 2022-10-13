import React from 'react';
declare type State = JSX.Element[] | undefined;
export declare type SideEffectProps = {
    reduceComponentsToState: <T extends {}>(components: Array<React.ReactElement<any>>, props: T) => State;
    handleStateChange?: (state: State) => void;
    headManager: any;
    inAmpMode?: boolean;
    children: React.ReactNode;
};
export default function SideEffect(props: SideEffectProps): null;
export {};
