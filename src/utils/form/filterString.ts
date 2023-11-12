export default function filterString(
  value: FormDataEntryValue | null | undefined
): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}
