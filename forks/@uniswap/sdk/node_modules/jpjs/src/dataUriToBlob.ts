/**
 * Convert a data URI into a Blob (a file)
 * @see https://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata/5100158
 *
 * @param dataURI A data URI
 *
 */
export function dataUriToBlob(dataURI: string) {
  // var binary = atob(dataURI.split(',')[1]);
  // var array = [];
  // for (var i = 0; i < binary.length; i++) {
  //   array.push(binary.charCodeAt(i));
  // }
  // return new Blob([new Uint8Array(array)], { type });
  // convert base64/URLEncoded data component to raw binary data held in a string
  let byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(dataURI.split(',')[1]);
  } else {
    byteString = decodeURI(dataURI.split(',')[1]);
  }

  // separate out the mime component
  const mimeString = dataURI
    .split(',')[0]
    .split(':')[1]
    .split(';')[0];

  // write the bytes of the string to a typed array
  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], { type: mimeString });
}
