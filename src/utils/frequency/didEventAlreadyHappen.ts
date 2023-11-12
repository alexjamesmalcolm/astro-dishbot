import parseSchedule from "./parseSchedule";

export default function didEventAlreadyHappen(
  startDate: Date,
  schedule: string
): boolean {
  const now = new Date();
  const s = parseSchedule(schedule);
  const next = s.next(1, startDate, now) as Date | 0;
  if (next === 0) {
    return false;
  }
  return now > next;
}
