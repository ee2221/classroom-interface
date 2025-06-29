import React, { useState } from 'react';
import { Save, Cloud, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';

interface SaveButtonProps {
  user: any;
  projectId?: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({ user, projectId }) => {
  const { 
    objects, 
    groups, 
    lights, 
    hasUnsavedChanges,
    lastSaved,
    saveProjectData,
    markSaved
  } = useSceneStore();
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    if (!user) {
      setSaveStatus('error');
      setSaveMessage('Please sign in to save');
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
      return;
    }

    if (!projectId) {
      setSaveStatus('error');
      setSaveMessage('No project selected');
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
      return;
    }

    setSaveStatus('saving');
    setSaveMessage('Saving to cloud...');

    try {
      await saveProjectData();
      
      setSaveStatus('success');
      setSaveMessage(`Saved ${objects.length} objects, ${groups.length} groups, ${lights.length} lights`);
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);

    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      setSaveMessage('Failed to save to cloud');
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 5000);
    }
  };

  const getButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Saving...</span>
          </>
        );
      case 'success':
        return (
          <>
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-green-400">Saved!</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium text-red-400">Error</span>
          </>
        );
      default:
        return (
          <>
            <Cloud className="w-5 h-5" />
            <Save className="w-4 h-4" />
            <span className="text-sm font-medium">
              {hasUnsavedChanges ? 'Save Changes' : 'Save to Cloud'}
            </span>
          </>
        );
    }
  };

  const getButtonStyles = () => {
    const baseStyles = "flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl shadow-black/20 border transition-all duration-200 font-medium";
    
    switch (saveStatus) {
      case 'saving':
        return `${baseStyles} bg-blue-500/20 border-blue-500/30 text-blue-400 cursor-wait`;
      case 'success':
        return `${baseStyles} bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 hover:scale-105 active:scale-95`;
      case 'error':
        return `${baseStyles} bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 hover:scale-105 active:scale-95`;
      default:
        if (hasUnsavedChanges) {
          return `${baseStyles} bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30 hover:scale-105 active:scale-95`;
        }
        return `${baseStyles} bg-[#1a1a1a] border-white/5 text-white/90 hover:bg-[#2a2a2a] hover:scale-105 active:scale-95`;
    }
  };

  const isDisabled = saveStatus === 'saving' || !user || !projectId;
  const hasContent = objects.length > 0 || groups.length > 0 || lights.length > 0;

  return (
    <div className="relative">
      <div className="flex flex-col items-start gap-2">
        <button
          onClick={handleSave}
          disabled={isDisabled || !hasContent}
          className={getButtonStyles()}
          title={
            !user
              ? 'Sign in to save'
              : !projectId
                ? 'Select a project to save'
                : !hasContent 
                  ? 'No content to save' 
                  : saveStatus === 'saving' 
                    ? 'Saving to Firebase...' 
                    : hasUnsavedChanges
                      ? 'Save unsaved changes to Firebase'
                      : 'Save current scene to Firebase'
          }
        >
          {getButtonContent()}
        </button>
        
        {/* Status Message */}
        {saveMessage && (
          <div className={`px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
            saveStatus === 'success' 
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : saveStatus === 'error'
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
          }`}>
            {saveMessage}
          </div>
        )}
        
        {/* Scene Info */}
        {hasContent && saveStatus === 'idle' && user && projectId && (
          <div className="bg-[#1a1a1a]/90 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/60">
            <div className="flex items-center gap-4">
              {objects.length > 0 && (
                <span>{objects.length} object{objects.length !== 1 ? 's' : ''}</span>
              )}
              {groups.length > 0 && (
                <span>{groups.length} group{groups.length !== 1 ? 's' : ''}</span>
              )}
              {lights.length > 0 && (
                <span>{lights.length} light{lights.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {lastSaved && (
              <div className="text-xs text-white/50 mt-1">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
            {hasUnsavedChanges && (
              <div className="text-xs text-orange-400 mt-1">
                • Unsaved changes
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SaveButton;