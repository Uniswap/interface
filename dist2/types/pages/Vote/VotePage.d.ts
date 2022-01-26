/// <reference types="react" />
import { RouteComponentProps } from 'react-router-dom';
export default function VotePage({ match: { params: { governorIndex, id }, }, }: RouteComponentProps<{
    governorIndex: string;
    id: string;
}>): JSX.Element;
