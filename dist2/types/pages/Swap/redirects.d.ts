/// <reference types="react" />
import { RouteComponentProps } from 'react-router-dom';
export declare function RedirectPathToSwapOnly({ location }: RouteComponentProps): JSX.Element;
export declare function RedirectToSwap(props: RouteComponentProps<{
    outputCurrency: string;
}>): JSX.Element;
export declare function OpenClaimAddressModalAndRedirectToSwap(props: RouteComponentProps): JSX.Element;
