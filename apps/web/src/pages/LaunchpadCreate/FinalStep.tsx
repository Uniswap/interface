export default function FinalStep({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack}>Back</button>
    </div>
  )
}
