import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Users,
  Settings,
  Save,
  AlertCircle,
  Info,
  Lock,
  Unlock,
  Share2,
  Globe,
  School
} from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: any) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    settings: {
      allowStudentEdit: true,
      allowStudentShare: false,
      maxObjects: 100,
      enableCollaboration: true,
      autoSave: true
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    onSubmit(formData);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      settings: {
        allowStudentEdit: true,
        allowStudentShare: false,
        maxObjects: 100,
        enableCollaboration: true,
        autoSave: true
      }
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white/90">Create New Project</h2>
              <p className="text-sm text-white/60">Set up a new 3D modeling project for your classroom</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70"
          >
            <X className="w-5 h-5" />
          </button>
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
                placeholder="Enter project name (e.g., 'Geometry Basics', 'Architecture Design')"
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
              <p className="text-xs text-white/50 mt-1">
                Recommended: 50-100 objects for beginners, 100-500 for advanced students
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-400 mb-1">Project Isolation</div>
                <div className="text-xs text-white/60">
                  Each project creates a completely separate workspace. Students in different projects cannot see or affect each other's work. You can always modify these settings later.
                </div>
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
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;