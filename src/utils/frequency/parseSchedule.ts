import later from "@breejs/later";

export default function parseSchedule(schedule: string) {
  const result = later.parse.text(schedule);
  const parsedSchedule = later.schedule(result);
  return parsedSchedule;
}
