interface SparkStarProps {
  filled?: boolean
  size?: number
  className?: string
}

// 4-pointed sparkle star: N/S points elongated, E/W shorter — camera flash glint style
export default function SparkStar({ filled = true, size = 16, className = '' }: SparkStarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 1.5 Q13 9 19.5 12 Q13 15 12 22.5 Q11 15 4.5 12 Q11 9 12 1.5Z"
        fill={filled ? '#C8F53C' : 'none'}
        stroke={filled ? '#C8F53C' : '#2a3318'}
        strokeWidth={filled ? 0 : 1.5}
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface StarRatingProps {
  rating: number
  max?: number
  size?: number
}

export function StarRating({ rating, max = 5, size = 14 }: StarRatingProps) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <SparkStar key={i} filled={i < Math.round(rating)} size={size} />
      ))}
    </span>
  )
}
