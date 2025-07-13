const Progress = ({ value, max = 100, className = '' }: { value: number; max?: number; className?: string }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 ${className}`}>
      <div 
        className="bg-primary h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default Progress;