import getFormattedCountdown from "@utils/frequency/getFormattedCountdown";
import { createEffect, createSignal } from "solid-js";

export default function Countdown({ date }: { date: Date }) {
  const [formatted, setFormatted] = createSignal<string>(
    getFormattedCountdown(date)
  );
  createEffect(() => {
    const intervalId = setInterval(() => {
      setFormatted(getFormattedCountdown(date));
    }, 1000);
    return () => clearInterval(intervalId);
  });
  return <>{formatted()}</>;
}
