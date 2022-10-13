import * as PopperJS from '@popperjs/core';
import * as React from 'react';

// Utility type
type UnionWhere<U, M> = U extends M ? U : never;

interface ManagerProps {
  children: React.ReactNode;
}
export class Manager extends React.Component<ManagerProps, {}> {}

export type RefHandler = (ref: HTMLElement | null) => void;

interface ReferenceChildrenProps {
  // React refs are supposed to be contravariant (allows a more general type to be passed rather than a more specific one)
  // However, Typescript currently can't infer that fact for refs
  // See https://github.com/microsoft/TypeScript/issues/30748 for more information
  ref: React.Ref<any>;
}

interface ReferenceProps {
  children: (props: ReferenceChildrenProps) => React.ReactNode;
  innerRef?: React.Ref<any>;
}
export class Reference extends React.Component<ReferenceProps, {}> {}

export interface PopperArrowProps {
  ref: React.Ref<any>;
  style: React.CSSProperties;
}

export interface PopperChildrenProps {
  ref: React.Ref<any>;
  style: React.CSSProperties;

  placement: PopperJS.Placement;
  isReferenceHidden?: boolean;
  hasPopperEscaped?: boolean;

  update: () => Promise<null | Partial<PopperJS.State>>;
  forceUpdate: () => Partial<PopperJS.State>;
  arrowProps: PopperArrowProps;
}

type StrictModifierNames = NonNullable<PopperJS.StrictModifiers['name']>;

export type StrictModifier<
  Name extends StrictModifierNames = StrictModifierNames
> = UnionWhere<PopperJS.StrictModifiers, { name?: Name }>;

export type Modifier<
  Name,
  Options extends object = object
> = Name extends StrictModifierNames
  ? StrictModifier<Name>
  : Partial<PopperJS.Modifier<Name, Options>>;

export interface PopperProps<Modifiers> {
  children: (props: PopperChildrenProps) => React.ReactNode;
  innerRef?: React.Ref<any>;
  modifiers?: ReadonlyArray<Modifier<Modifiers>>;
  placement?: PopperJS.Placement;
  strategy?: PopperJS.PositioningStrategy;
  referenceElement?: HTMLElement | PopperJS.VirtualElement;
  onFirstUpdate?: (state: Partial<PopperJS.State>) => void;
}
export class Popper<Modifiers> extends React.Component<
  PopperProps<Modifiers>,
  {}
> {}

export function usePopper<Modifiers>(
  referenceElement?: Element | PopperJS.VirtualElement | null,
  popperElement?: HTMLElement | null,
  options?: Omit<Partial<PopperJS.Options>, 'modifiers'> & {
    createPopper?: typeof PopperJS.createPopper;
    modifiers?: ReadonlyArray<Modifier<Modifiers>>;
  }
): {
  styles: { [key: string]: React.CSSProperties };
  attributes: { [key: string]: { [key: string]: string } | undefined };
  state: PopperJS.State | null;
  update: PopperJS.Instance['update'] | null;
  forceUpdate: PopperJS.Instance['forceUpdate'] | null;
};
