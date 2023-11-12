import later from "@breejs/later";

export function getNextDate(schedule: string, date: Date): Date {
  const nextDates = parseSchedule(schedule).next(10, date) as Date[];
  for (let i = 0; i < nextDates.length; i++) {
    const nextDate = nextDates[i];
    if (nextDate > date) {
      return nextDate;
    }
  }
  throw new Error(
    `Not able to find the next date for schedule "${schedule}" after ${date.toISOString()}`
  );
}

export function isValidFrequency(schedule: string): boolean {
  const result = later.parse.text(schedule);
  return result.error === -1;
}

export function parseSchedule(schedule: string) {
  const result = later.parse.text(schedule);
  const parsedSchedule = later.schedule(result);
  return parsedSchedule;
}

export function didEventAlreadyHappen(
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

const oneSecond = 1000;
const oneMinute = oneSecond * 60;
const oneHour = oneMinute * 60;
const oneDay = oneHour * 24;

function divideAndRound(numerator: number, denominator: number): number {
  return Math.floor(numerator / denominator);
}

export function getFormattedCountdown(date: Date): string {
  const difference = date.getTime() - new Date().getTime();
  if (difference < 0) {
    return "Already elapsed";
  }
  const data: [number, string][] = [
    [divideAndRound(difference, oneDay), "d"],
    [divideAndRound(difference % oneDay, oneHour), "h"],
    [divideAndRound(difference % oneHour, oneMinute), "m"],
    [divideAndRound(difference % oneMinute, oneSecond), "s"],
  ];
  return data
    .filter(([value]) => value > 0)
    .map(([value, unit]) => `${value}${unit}`)
    .join(" ");
}
