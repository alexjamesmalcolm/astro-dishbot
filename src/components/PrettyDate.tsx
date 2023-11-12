export default function PrettyDate({ date }: { date: string }) {
  return <>{new Date(date).toLocaleString()}</>;
}
