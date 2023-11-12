import filterString from "@utils/form/filterString";
import FormErrors from "./FormErrors";

export default function StringField({
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
    <>
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
    </>
  );
}
