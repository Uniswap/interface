/// <reference types="react" />
import { AbstractConnector } from '@web3-react/abstract-connector';
import { Connector } from 'widgets-web3-react/types';
export default function StatusIcon({ connector }: {
    connector: AbstractConnector | Connector;
}): JSX.Element | null;
