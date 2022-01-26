/// <reference types="react" />
import { RouteComponentProps } from 'react-router';
export default function MigrateV2Pair({ match: { params: { address }, }, }: RouteComponentProps<{
    address: string;
}>): JSX.Element;
