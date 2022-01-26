/// <reference types="react" />
interface ToggleProps {
    id?: string;
    isActive: boolean;
    bgColor: string;
    toggle: () => void;
}
export default function ListToggle({ id, isActive, bgColor, toggle }: ToggleProps): JSX.Element;
export {};
