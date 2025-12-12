export type SortDirection = 'asc' | 'desc';

export function isSortedStrings(values: string[], direction: SortDirection = 'asc'): boolean {
  const normalized = values.map((value) => value.toLowerCase());
  for (let i = 1; i < normalized.length; i += 1) {
    const prev = normalized[i - 1];
    const curr = normalized[i];
    if (direction === 'asc' && prev > curr) {
      return false;
    }
    if (direction === 'desc' && prev < curr) {
      return false;
    }
  }
  return true;
}

export function isSortedNumbers(values: number[], direction: SortDirection = 'asc'): boolean {
  for (let i = 1; i < values.length; i += 1) {
    const prev = values[i - 1];
    const curr = values[i];
    if (direction === 'asc' && prev > curr) {
      return false;
    }
    if (direction === 'desc' && prev < curr) {
      return false;
    }
  }
  return true;
}

export function haveSameElementsIgnoreOrder<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}
