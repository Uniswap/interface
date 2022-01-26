import React from 'react';
import { PositionDetails } from 'types/position';
declare type PositionListProps = React.PropsWithChildren<{
    positions: PositionDetails[];
    setUserHideClosedPositions: any;
    userHideClosedPositions: boolean;
}>;
export default function PositionList({ positions, setUserHideClosedPositions, userHideClosedPositions, }: PositionListProps): JSX.Element;
export {};
