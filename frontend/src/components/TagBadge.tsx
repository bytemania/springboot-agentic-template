interface TagBadgeProps {
  tag: string
  onRemove?: (tag: string) => void
}

export function TagBadge({ tag, onRemove }: TagBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
      {tag}
      {onRemove && (
        <button
          onClick={() => onRemove(tag)}
          className="hover:text-indigo-900 leading-none"
          aria-label={`Remove tag ${tag}`}
        >
          &times;
        </button>
      )}
    </span>
  )
}
