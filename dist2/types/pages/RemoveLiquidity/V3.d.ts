/// <reference types="react" />
import { RouteComponentProps } from 'react-router-dom';
export default function RemoveLiquidityV3({ location, match: { params: { tokenId }, }, }: RouteComponentProps<{
    tokenId: string;
}>): JSX.Element;
