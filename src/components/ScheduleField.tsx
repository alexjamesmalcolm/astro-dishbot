import filterString from "@utils/form/filterString";
import isValidFrequency from "@utils/frequency/isValidFrequency";
import parseSchedule from "@utils/frequency/parseSchedule";
import { For, createSignal } from "solid-js";
import FormErrors from "./FormErrors";

export default function ScheduleField({
  name,
  initialFormData,
  errors,
  label,
}: {
  name: string;
  initialFormData: FormData | undefined;
  errors: string[] | undefined;
  label: string;
}) {
  const [nextDates, setNextDates] = createSignal<Date[]>([]);
  return (
    <>
      <label for={name}>{label}</label>
      <div class="control">
        <input
          value={filterString(initialFormData?.get(name))}
          class="input"
          required
          id={name}
          name={name}
          onInput={(event) => {
            const inputElement = event.target;
            const value = inputElement.value.trim();
            if (isValidFrequency(value)) {
              inputElement.setCustomValidity("");
              const schedule = parseSchedule(value);
              const nextDates = schedule.next(5, new Date());
              setNextDates(Array.isArray(nextDates) ? nextDates : [nextDates]);
            } else {
              inputElement.setCustomValidity("This is not a valid schedule");
              setNextDates([]);
            }
          }}
        />
      </div>
      <For each={nextDates()}>{(date) => <li>{date.toLocaleString()}</li>}</For>
      <FormErrors errors={errors} />
    </>
  );
}
