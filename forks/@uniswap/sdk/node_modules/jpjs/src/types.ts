export type Omit<T, K extends keyof T> = Pick<
  T,
  ({ [P in keyof T]: P } &
    { [P in K]: never } & { [x: string]: never })[keyof T]
>;

export type PartialDeep<T> = { [P in keyof T]?: PartialDeep<T[P]> };
export type Many<T> = T | T[];
export interface Geo {
  /**
   * latitude
   */
  lat: number;

  /**
   * longitude
   */
  lng: number;
}
