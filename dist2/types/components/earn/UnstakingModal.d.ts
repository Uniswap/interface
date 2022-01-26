/// <reference types="react" />
import { StakingInfo } from '../../state/stake/hooks';
interface StakingModalProps {
    isOpen: boolean;
    onDismiss: () => void;
    stakingInfo: StakingInfo;
}
export default function UnstakingModal({ isOpen, onDismiss, stakingInfo }: StakingModalProps): JSX.Element;
export {};
