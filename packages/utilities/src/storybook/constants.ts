const BASE_WAIT_TIME = 250

export enum StorybookTestingSleepTimes {
  SHORT = BASE_WAIT_TIME,
  MEDIUM = BASE_WAIT_TIME * 2,
  LONG = BASE_WAIT_TIME * 3,
  XL = BASE_WAIT_TIME * 4,
}
