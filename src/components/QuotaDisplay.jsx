export default function QuotaDisplay({ assigned, quota }) {
  const percentage = (assigned / quota) * 100
  const remaining = quota - assigned
  
  let colorClass = 'bg-green-500'
  if (percentage >= 90) colorClass = 'bg-red-500'
  else if (percentage >= 70) colorClass = 'bg-orange-500'
  else if (percentage >= 50) colorClass = 'bg-yellow-500'
  
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>Used: {assigned}/{quota}</span>
        <span>Left: {remaining}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`${colorClass} rounded-full h-2 transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}