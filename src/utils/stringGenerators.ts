export type CharCategory = 'latin' | 'digits' | 'symbols' | 'whitespace' | 'mixed' | 'unicode';

const latinCharset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const digitCharset = '0123456789';
const symbolCharset = '!@#$%^&*()_+-=[]{};:\'",.<>/?\\|`~';
const whitespaceCharset = ' \t';
const unicodeCharset = 'áéíóúüñßøΩЖ漢😀😁😂🤣😅😇';

export function repeatString(pattern: string, times: number): string {
  return new Array(times).fill(pattern).join('');
}

export function randomFromCharset(length: number, charset: string): string {
  if (length <= 0) return '';
  let result = '';
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * charset.length);
    result += charset[index] ?? '';
  }
  return result;
}

export function generateString(length: number, category: CharCategory = 'mixed'): string {
  switch (category) {
    case 'latin':
      return randomFromCharset(length, latinCharset);
    case 'digits':
      return randomFromCharset(length, digitCharset);
    case 'symbols':
      return randomFromCharset(length, symbolCharset);
    case 'whitespace':
      return repeatString(' ', length);
    case 'unicode':
      return randomFromCharset(length, unicodeCharset);
    case 'mixed':
    default:
      return randomFromCharset(length, latinCharset + digitCharset + symbolCharset + whitespaceCharset);
  }
}

export function trimToMaxLength(value: string, maxLength: number): string {
  if (maxLength <= 0) return '';
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength);
}

export const edgeCaseStrings = {
  empty: '',
  singleSpace: ' ',
  multiSpace: '     ',
  longLatin: generateString(256, 'latin'),
  longDigits: generateString(256, 'digits'),
  specialSymbols: generateString(64, 'symbols'),
  unicodeShort: generateString(16, 'unicode'),
  unicodeLong: generateString(128, 'unicode'),
};
