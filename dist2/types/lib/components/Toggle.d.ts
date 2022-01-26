/// <reference types="react" />
interface ToggleProps {
    checked: boolean;
    onToggle: () => void;
}
export default function Toggle({ checked, onToggle }: ToggleProps): JSX.Element;
export {};
