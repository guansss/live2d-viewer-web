export function nonNullableFilter<T extends any>(value: T, index: number, array: T[]): value is NonNullable<T> {
    return value !== undefined && value !== null;
}
  