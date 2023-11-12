import parseSchedule from "./parseSchedule";

export default function getNextDate(schedule: string, date: Date): Date {
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
