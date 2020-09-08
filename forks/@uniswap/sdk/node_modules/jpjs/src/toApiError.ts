/** Convert a Dropwizard API error from an Axios fetcher into a string */
export function toApiError(err: any): string {
  if (
    err.response &&
    err.response.data &&
    err.response.data.error_description
  ) {
    return err.response.data.error_description;
  } else if (err.response && err.response.data && err.response.data.message) {
    return err.response.data.message;
  } else {
    let status = err.response && err.response.status ? err.response.status : -1;
    return (
      'We are having difficulty connecting to the server.' +
      ' Please check your internet connection and try again. (code ' +
      status +
      ')'
    );
  }
}
