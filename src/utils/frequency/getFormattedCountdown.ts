const oneSecond = 1000;
const oneMinute = oneSecond * 60;
const oneHour = oneMinute * 60;
const oneDay = oneHour * 24;

function divideAndRound(numerator: number, denominator: number): number {
  return Math.floor(numerator / denominator);
}

export default function getFormattedCountdown(date: Date): string {
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
