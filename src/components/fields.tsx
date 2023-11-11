import FormErrors from "@components/FormErrors";
import { isValidFrequency, parseSchedule } from "@utils/frequency";
import { For, createSignal } from "solid-js";

function filterString(
  value: FormDataEntryValue | null | undefined
): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

export function StringField({
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
  return (
    <div class="field">
      <label for={name}>{label}</label>
      <div class="control">
        <input
          value={filterString(initialFormData?.get(name))}
          class="input"
          required
          id={name}
          name={name}
        />
      </div>
      <FormErrors errors={errors} />
    </div>
  );
}

export function ScheduleField({
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
    <div class="field">
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
    </div>
  );
}

export function CurrencyField({
  name,
  initialFormData,
  errors,
}: {
  name: string;
  initialFormData: FormData | undefined;
  errors: string[] | undefined;
}) {
  return (
    <div class="field">
      <label for={name}>Fine Amount</label>
      <div class="control">
        <input
          class="input"
          type="number"
          id={name}
          name={name}
          min="0"
          required
          value={filterString(initialFormData?.get(name))}
        />
      </div>
      <FormErrors errors={errors} />
    </div>
  );
}
