import React from 'react';
import { GraduationCap } from 'lucide-react';

interface ClassroomButtonProps {
  onClick: () => void;
  user: any;
}

const ClassroomButton: React.FC<ClassroomButtonProps> = ({ onClick, user }) => {
  if (!user) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-xl shadow-2xl shadow-black/20 border border-white/5 transition-all duration-200 hover:scale-105 group"
      title="Open Classroom (Manage Projects)"
    >
      <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
        <GraduationCap className="w-5 h-5 text-blue-400" />
      </div>
      <div className="hidden sm:block">
        <div className="text-sm font-medium text-white/90">Classroom</div>
        <div className="text-xs text-white/60">Manage Projects</div>
      </div>
      
      {/* Tooltip for mobile */}
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap sm:hidden">
        Open Classroom
      </div>
    </button>
  );
};

export default ClassroomButton;