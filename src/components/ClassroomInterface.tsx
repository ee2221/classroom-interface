import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Users,
  Settings,
  BookOpen,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Share2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  UserPlus,
  Download,
  Upload,
  FolderOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  User,
  Mail,
  School,
  Globe,
  Shield,
  Archive,
  Star,
  StarOff
} from 'lucide-react';
import { useClassroomStore } from '../store/classroomStore';
import { auth } from '../config/firebase';
import CreateProjectModal from './CreateProjectModal';
import ProjectSettingsModal from './ProjectSettingsModal';
import StudentManagementModal from './StudentManagementModal';
import ShareProjectModal from './ShareProjectModal';

interface ClassroomInterfaceProps {
  user: any;
  onProjectSelect: (projectId: string) => void;
  onClose: () => void;
}

const ClassroomInterface: React.FC<ClassroomInterfaceProps> = ({ 
  user, 
  onProjectSelect, 
  onClose 
}) => {
  const {
    projects,
    currentProject,
    loading,
    error,
    searchTerm,
    filterStatus,
    sortBy,
    viewMode,
    selectedProjects,
    setSearchTerm,
    setFilterStatus,
    setSortBy,
    setViewMode,
    setSelectedProjects,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    archiveProject,
    toggleProjectFavorite,
    addStudentToProject,
    removeStudentFromProject,
    updateStudentRole,
    exportProject,
    importProject
  } = useClassroomStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectMenu, setShowProjectMenu] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProjects(user.uid);
    }
  }, [user, loadProjects]);

  const handleCreateProject = async (projectData: any) => {
    try {
      await createProject({
        ...projectData,
        teacherId: user.uid,
        teacherName: user.displayName || user.email,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleProjectAction = (action: string, project: any) => {
    setSelectedProject(project);
    setShowProjectMenu(null);

    switch (action) {
      case 'open':
        onProjectSelect(project.id);
        break;
      case 'edit':
        setShowSettingsModal(true);
        break;
      case 'students':
        setShowStudentModal(true);
        break;
      case 'share':
        setShowShareModal(true);
        break;
      case 'duplicate':
        duplicateProject(project.id);
        break;
      case 'archive':
        archiveProject(project.id);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
          deleteProject(project.id);
        }
        break;
      case 'favorite':
        toggleProjectFavorite(project.id);
        break;
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && project.status === 'active') ||
                         (filterStatus === 'archived' && project.status === 'archived') ||
                         (filterStatus === 'favorites' && project.isFavorite);

    return matchesSearch && matchesFilter;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'students':
        return (b.students?.length || 0) - (a.students?.length || 0);
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'archived':
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
      case 'draft':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#1a1a1a] rounded-xl p-8 text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading classroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <GraduationCap className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white/90">Classroom Projects</h1>
              <p className="text-white/60">Manage your 3D modeling projects and students</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0f0f0f]">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50 w-64"
              />
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white/90 focus:outline-none focus:border-blue-500/50"
            >
              <option value="all">All Projects</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="favorites">Favorites</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white/90 focus:outline-none focus:border-blue-500/50"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Date Created</option>
              <option value="name">Name</option>
              <option value="students">Student Count</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode */}
            <div className="flex bg-[#2a2a2a] rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-white/70 hover:text-white/90'
                }`}
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-white/70 hover:text-white/90'
                }`}
              >
                <div className="w-4 h-4 flex flex-col gap-1">
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                </div>
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedProjects.length > 0 && (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-white/10">
                <span className="text-sm text-white/60">
                  {selectedProjects.length} selected
                </span>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70">
                  <Archive className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {sortedProjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white/70 mb-2">
                {searchTerm || filterStatus !== 'all' ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-white/50 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first project to get started with 3D modeling in the classroom'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Create First Project
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-[#2a2a2a] rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-200 group"
                >
                  {/* Project Header */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white/90 truncate mb-1">
                          {project.name}
                        </h3>
                        <p className="text-sm text-white/60 line-clamp-2">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleProjectAction('favorite', project)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          {project.isFavorite ? (
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4 text-white/50" />
                          )}
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setShowProjectMenu(showProjectMenu === project.id ? null : project.id)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-white/70" />
                          </button>
                          {showProjectMenu === project.id && (
                            <div className="absolute right-0 top-8 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-lg z-10 min-w-48">
                              <button
                                onClick={() => handleProjectAction('open', project)}
                                className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                              >
                                <FolderOpen className="w-4 h-4" />
                                Open Project
                              </button>
                              <button
                                onClick={() => handleProjectAction('edit', project)}
                                className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                              >
                                <Edit3 className="w-4 h-4" />
                                Edit Settings
                              </button>
                              <button
                                onClick={() => handleProjectAction('students', project)}
                                className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                              >
                                <Users className="w-4 h-4" />
                                Manage Students
                              </button>
                              <button
                                onClick={() => handleProjectAction('share', project)}
                                className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                              >
                                <Share2 className="w-4 h-4" />
                                Share Project
                              </button>
                              <div className="border-t border-white/10 my-1"></div>
                              <button
                                onClick={() => handleProjectAction('duplicate', project)}
                                className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                              >
                                <Copy className="w-4 h-4" />
                                Duplicate
                              </button>
                              <button
                                onClick={() => handleProjectAction('archive', project)}
                                className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                              >
                                <Archive className="w-4 h-4" />
                                {project.status === 'archived' ? 'Unarchive' : 'Archive'}
                              </button>
                              <button
                                onClick={() => handleProjectAction('delete', project)}
                                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                      {project.status === 'active' && <CheckCircle className="w-3 h-3" />}
                      {project.status === 'archived' && <Archive className="w-3 h-3" />}
                      {project.status === 'draft' && <Clock className="w-3 h-3" />}
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </div>
                  </div>

                  {/* Project Stats */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white/90">
                          {project.students?.length || 0}
                        </div>
                        <div className="text-xs text-white/60">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white/90">
                          {project.objectCount || 0}
                        </div>
                        <div className="text-xs text-white/60">Objects</div>
                      </div>
                    </div>

                    <div className="text-xs text-white/50 mb-3">
                      Updated {formatDate(project.updatedAt)}
                    </div>

                    <button
                      onClick={() => handleProjectAction('open', project)}
                      className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Open Project
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#2a2a2a] rounded-xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-sm font-medium text-white/70">
                <div className="col-span-4">Project</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Students</div>
                <div className="col-span-2">Updated</div>
                <div className="col-span-2">Actions</div>
              </div>
              {sortedProjects.map((project) => (
                <div
                  key={project.id}
                  className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <button
                      onClick={() => handleProjectAction('favorite', project)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {project.isFavorite ? (
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      ) : (
                        <StarOff className="w-4 h-4 text-white/50" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white/90 truncate">
                        {project.name}
                      </div>
                      <div className="text-sm text-white/60 truncate">
                        {project.description || 'No description'}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                      {project.status === 'active' && <CheckCircle className="w-3 h-3" />}
                      {project.status === 'archived' && <Archive className="w-3 h-3" />}
                      {project.status === 'draft' && <Clock className="w-3 h-3" />}
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center text-white/90">
                    {project.students?.length || 0}
                  </div>
                  <div className="col-span-2 flex items-center text-white/70 text-sm">
                    {formatDate(project.updatedAt)}
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <button
                      onClick={() => handleProjectAction('open', project)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
                    >
                      Open
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowProjectMenu(showProjectMenu === project.id ? null : project.id)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-white/70" />
                      </button>
                      {showProjectMenu === project.id && (
                        <div className="absolute right-0 top-8 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-lg z-10 min-w-48">
                          <button
                            onClick={() => handleProjectAction('edit', project)}
                            className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit Settings
                          </button>
                          <button
                            onClick={() => handleProjectAction('students', project)}
                            className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                          >
                            <Users className="w-4 h-4" />
                            Manage Students
                          </button>
                          <button
                            onClick={() => handleProjectAction('share', project)}
                            className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                          >
                            <Share2 className="w-4 h-4" />
                            Share Project
                          </button>
                          <div className="border-t border-white/10 my-1"></div>
                          <button
                            onClick={() => handleProjectAction('duplicate', project)}
                            className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => handleProjectAction('archive', project)}
                            className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                          >
                            <Archive className="w-4 h-4" />
                            {project.status === 'archived' ? 'Unarchive' : 'Archive'}
                          </button>
                          <button
                            onClick={() => handleProjectAction('delete', project)}
                            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
        />

        {selectedProject && (
          <>
            <ProjectSettingsModal
              isOpen={showSettingsModal}
              onClose={() => {
                setShowSettingsModal(false);
                setSelectedProject(null);
              }}
              project={selectedProject}
              onUpdate={(data) => updateProject(selectedProject.id, data)}
            />

            <StudentManagementModal
              isOpen={showStudentModal}
              onClose={() => {
                setShowStudentModal(false);
                setSelectedProject(null);
              }}
              project={selectedProject}
              onAddStudent={(email, role) => addStudentToProject(selectedProject.id, email, role)}
              onRemoveStudent={(studentId) => removeStudentFromProject(selectedProject.id, studentId)}
              onUpdateRole={(studentId, role) => updateStudentRole(selectedProject.id, studentId, role)}
            />

            <ShareProjectModal
              isOpen={showShareModal}
              onClose={() => {
                setShowShareModal(false);
                setSelectedProject(null);
              }}
              project={selectedProject}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ClassroomInterface;