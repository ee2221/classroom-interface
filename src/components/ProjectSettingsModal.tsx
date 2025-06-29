import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Save,
  AlertCircle,
  Info,
  Lock,
  Unlock,
  Share2,
  Users,
  Trash2,
  Archive,
  Star,
  StarOff
} from 'lucide-react';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onUpdate: (data: any) => void;
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    settings: {
      allowStudentEdit: true,
      allowStudentShare: false,
      maxObjects: 100,
      enableCollaboration: true,
      autoSave: true
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'active',
        settings: {
          allowStudentEdit: true,
          allowStudentShare: false,
          maxObjects: 100,
          enableCollaboration: true,
          autoSave: true,
          ...project.settings
        }
      });
      setHasChanges(false);
    }
  }, [project]);

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('settings.')) {
      const settingKey = field.replace('settings.', '');
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    setHasChanges(true);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Project name must be at least 3 characters';
    }

    if (formData.settings.maxObjects < 1 || formData.settings.maxObjects > 1000) {
      newErrors.maxObjects = 'Max objects must be between 1 and 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onUpdate(formData);
    setHasChanges(false);
    onClose();
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Settings className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white/90">Project Settings</h2>
              <p className="text-sm text-white/60">Configure {project.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                Unsaved changes
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white/90 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Basic Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full bg-[#2a2a2a] border rounded-lg px-3 py-2 text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50 ${
                  errors.name ? 'border-red-500/50' : 'border-white/10'
                }`}
                placeholder="Enter project name"
              />
              {errors.name && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-2 text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50 resize-none"
                placeholder="Describe what students will learn and create in this project..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Project Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-2 text-white/90 focus:outline-none focus:border-blue-500/50"
              >
                <option value="active">Active - Students can access and work</option>
                <option value="archived">Archived - Read-only access</option>
                <option value="draft">Draft - Hidden from students</option>
              </select>
            </div>
          </div>

          {/* Student Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white/90 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              Student Permissions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${formData.settings.allowStudentEdit ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    {formData.settings.allowStudentEdit ? (
                      <Unlock className="w-4 h-4 text-green-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/90">Allow Editing</div>
                    <div className="text-xs text-white/60">Students can modify objects</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('settings.allowStudentEdit', !formData.settings.allowStudentEdit)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.settings.allowStudentEdit ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.settings.allowStudentEdit ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${formData.settings.allowStudentShare ? 'bg-blue-500/20' : 'bg-gray-500/20'}`}>
                    <Share2 className={`w-4 h-4 ${formData.settings.allowStudentShare ? 'text-blue-400' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/90">Allow Sharing</div>
                    <div className="text-xs text-white/60">Students can share projects</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('settings.allowStudentShare', !formData.settings.allowStudentShare)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.settings.allowStudentShare ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.settings.allowStudentShare ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${formData.settings.enableCollaboration ? 'bg-purple-500/20' : 'bg-gray-500/20'}`}>
                    <Users className={`w-4 h-4 ${formData.settings.enableCollaboration ? 'text-purple-400' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/90">Collaboration</div>
                    <div className="text-xs text-white/60">Multiple students can work together</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('settings.enableCollaboration', !formData.settings.enableCollaboration)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.settings.enableCollaboration ? 'bg-purple-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.settings.enableCollaboration ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${formData.settings.autoSave ? 'bg-orange-500/20' : 'bg-gray-500/20'}`}>
                    <Save className={`w-4 h-4 ${formData.settings.autoSave ? 'text-orange-400' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/90">Auto Save</div>
                    <div className="text-xs text-white/60">Automatically save student work</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('settings.autoSave', !formData.settings.autoSave)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.settings.autoSave ? 'bg-orange-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Project Limits */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white/90 flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-400" />
              Project Limits
            </h3>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Maximum Objects per Student
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.settings.maxObjects}
                onChange={(e) => handleInputChange('settings.maxObjects', parseInt(e.target.value) || 100)}
                className={`w-full bg-[#2a2a2a] border rounded-lg px-3 py-2 text-white/90 focus:outline-none focus:border-blue-500/50 ${
                  errors.maxObjects ? 'border-red-500/50' : 'border-white/10'
                }`}
              />
              {errors.maxObjects && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.maxObjects}
                </div>
              )}
            </div>
          </div>

          {/* Project Stats */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white/90">Project Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white/90">{project.students?.length || 0}</div>
                <div className="text-sm text-white/60">Students</div>
              </div>
              <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white/90">{project.objectCount || 0}</div>
                <div className="text-sm text-white/60">Objects</div>
              </div>
              <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white/90">
                  {project.createdAt ? Math.floor((Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                </div>
                <div className="text-sm text-white/60">Days Old</div>
              </div>
              <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white/90">
                  {project.updatedAt ? Math.floor((Date.now() - new Date(project.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                </div>
                <div className="text-sm text-white/60">Days Since Update</div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white/70 hover:text-white/90 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasChanges}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                hasChanges
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectSettingsModal;