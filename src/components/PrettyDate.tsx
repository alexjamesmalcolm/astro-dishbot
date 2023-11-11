export default function PrettyDate({ date }: { date: string }) {
  console.log(date);
  return <>{new Date(date).toLocaleString()}</>;
}
