import './Segmented.css'

// Segment switch for 2–3 views of the same list (UX review Runde 5, #54).
// Looks like one control, not like two buttons. Pass the options and the selected value.
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className="segmented__option text-label"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
