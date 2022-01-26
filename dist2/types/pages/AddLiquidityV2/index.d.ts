/// <reference types="react" />
import { RouteComponentProps } from 'react-router-dom';
export default function AddLiquidity({ match: { params: { currencyIdA, currencyIdB }, }, history, }: RouteComponentProps<{
    currencyIdA?: string;
    currencyIdB?: string;
}>): JSX.Element;
