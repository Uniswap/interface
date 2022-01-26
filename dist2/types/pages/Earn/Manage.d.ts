/// <reference types="react" />
import { RouteComponentProps } from 'react-router-dom';
export default function Manage({ match: { params: { currencyIdA, currencyIdB }, }, }: RouteComponentProps<{
    currencyIdA: string;
    currencyIdB: string;
}>): JSX.Element;
