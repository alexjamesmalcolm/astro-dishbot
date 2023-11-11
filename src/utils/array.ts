export function getNext<Type>(
  list: Type[],
  currentIndex: number
): Type | undefined {
  if (list.length === 0) {
    return undefined;
  }
  let nextIndex = currentIndex + 1;
  if (nextIndex === list.length) {
    nextIndex = 0;
  }
  return list[nextIndex];
}
