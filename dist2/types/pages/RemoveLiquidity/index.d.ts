/// <reference types="react" />
import { RouteComponentProps } from 'react-router';
export default function RemoveLiquidity({ history, match: { params: { currencyIdA, currencyIdB }, }, }: RouteComponentProps<{
    currencyIdA: string;
    currencyIdB: string;
}>): JSX.Element;
