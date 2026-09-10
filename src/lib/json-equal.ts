export function jsonEqual(left: unknown, right: unknown): boolean {
  const serialize = (value: unknown) => JSON.stringify(value, (_key, item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]]));
    }
    return item;
  });
  return serialize(left) === serialize(right);
}
