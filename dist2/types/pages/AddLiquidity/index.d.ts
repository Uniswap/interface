/// <reference types="react" />
import { RouteComponentProps } from 'react-router-dom';
export default function AddLiquidity({ match: { params: { currencyIdA, currencyIdB, feeAmount: feeAmountFromUrl, tokenId }, }, history, }: RouteComponentProps<{
    currencyIdA?: string;
    currencyIdB?: string;
    feeAmount?: string;
    tokenId?: string;
}>): JSX.Element;
