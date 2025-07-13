const Tooltip = ({ children, content }: { children: any; content: string }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {content}
      </div>
    </div>
  );
};

export default Tooltip;