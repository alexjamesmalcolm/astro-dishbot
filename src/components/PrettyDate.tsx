export default function PrettyDate({ date }: { date: Date }) {
  return <>{date.toLocaleString()}</>;
}
