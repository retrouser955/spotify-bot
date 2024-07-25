export function occurrenceSort<T>(arr: T[]): T[] {
    const frequencies = arr.reduce((accumulator, currentValue) => {
      const count = (accumulator.get(currentValue) ?? 0) + 1;
      accumulator.set(currentValue, count);
      return accumulator;
    }, new Map<T, number>());
  
    const sorted = Array.from(frequencies.entries()).sort((a, b) => b[1] - a[1]);
    return sorted.map((item) => item[0]);
}