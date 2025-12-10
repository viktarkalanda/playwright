export function randomInt(minInclusive: number, maxInclusive: number): number {
  if (maxInclusive < minInclusive) {
    throw new Error('maxInclusive must be greater than or equal to minInclusive');
  }
  const delta = maxInclusive - minInclusive + 1;
  return Math.floor(Math.random() * delta) + minInclusive;
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickRandomSubset<T>(items: T[], count: number): T[] {
  if (count < 0) {
    throw new Error('count must be non-negative');
  }
  if (count > items.length) {
    throw new Error('count cannot exceed the number of available items');
  }
  if (count === 0) {
    return [];
  }
  const shuffled = shuffle(items);
  return shuffled.slice(0, count);
}

export function range(fromInclusive: number, toExclusive: number): number[] {
  if (toExclusive < fromInclusive) {
    throw new Error('toExclusive must be greater than or equal to fromInclusive');
  }
  const result: number[] = [];
  for (let value = fromInclusive; value < toExclusive; value += 1) {
    result.push(value);
  }
  return result;
}
