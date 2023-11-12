import later from "@breejs/later";

export default function isValidFrequency(schedule: string): boolean {
  const result = later.parse.text(schedule);
  return result.error === -1;
}
