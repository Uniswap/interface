import { Percent } from '@uniswap/sdk-core';
import { ReactNode } from 'react';
export declare function SwapPoolTabs({ active }: {
    active: 'swap' | 'pool';
}): JSX.Element;
export declare function FindPoolTabs({ origin }: {
    origin: string;
}): JSX.Element;
export declare function AddRemoveTabs({ adding, creating, defaultSlippage, positionID, children, }: {
    adding: boolean;
    creating: boolean;
    defaultSlippage: Percent;
    positionID?: string | undefined;
    showBackLink?: boolean;
    children?: ReactNode | undefined;
}): JSX.Element;
export declare function CreateProposalTabs(): JSX.Element;
