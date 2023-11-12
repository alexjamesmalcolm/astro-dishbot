import filterString from "@utils/form/filterString";
import FormErrors from "./FormErrors";

export default function CurrencyField({
  name,
  initialFormData,
  errors,
}: {
  name: string;
  initialFormData: FormData | undefined;
  errors: string[] | undefined;
}) {
  return (
    <>
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
    </>
  );
}
