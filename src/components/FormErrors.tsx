export default function FormErrors({
  errors = [],
}: {
  errors: string[] | undefined;
}) {
  return errors.map((error) => <p class="help is-danger">{error}</p>);
}
