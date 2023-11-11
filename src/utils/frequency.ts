import later from "@breejs/later";

export function isValidFrequency(schedule: string): boolean {
  const result = later.parse.text(schedule);
  return result.error === -1;
}

export function parseSchedule(schedule: string) {
  const result = later.parse.text(schedule);
  const parsedSchedule = later.schedule(result);
  return parsedSchedule;
}

export function didEventAlreadyHappen(schedule: string, date: Date): boolean {
  const ranges = parseSchedule(schedule).prevRange(12) as unknown as [
    Date,
    Date
  ][];
  if (!Array.isArray(ranges)) {
    throw new Error("Was expecting a range of dates");
  }
  for (const [start, end] of ranges) {
    if (date >= start && date <= end) {
      return true;
    }
  }
  return false;
}
