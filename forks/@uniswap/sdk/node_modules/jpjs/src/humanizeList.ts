/**
 * Converts array of strings into a humanized list.
 *
 * @example ['jared', 'ian', 'alexis'] // 'jared, ian, and alexis'
 */
export function humanizeList(
  list: string[],
  options: {
    oxfordComma: boolean;
    conjunction: string;
    skipConjunction: boolean;
  } = {
    oxfordComma: true,
    skipConjunction: false,
    conjunction: 'and',
  }
) {
  if (!Array.isArray(list)) {
    throw new TypeError('humanize-list expected an array');
  }

  const listLength = list.length;

  if (listLength === 1) {
    return list[0];
  }

  if (options.skipConjunction) {
    return list.join(', ');
  }

  let humanizedList = '';
  if (listLength === 2) {
    return list.join(` ${options.conjunction} `);
  }
  for (let i = 0; i < listLength; i++) {
    if (i === listLength - 1) {
      if (options.oxfordComma) {
        humanizedList += ',';
      }

      humanizedList += ' ' + options.conjunction + ' ';
    } else if (i !== 0) {
      humanizedList += ', ';
    }

    humanizedList += list[i];
  }

  return humanizedList;
}
