import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Mail,
  Trash2,
  Crown,
  User,
  Search,
  Send,
  Copy,
  ExternalLink,
  Calendar,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface StudentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onAddStudent: (email: string, role: 'student' | 'assistant') => void;
  onRemoveStudent: (studentId: string) => void;
  onUpdateRole: (studentId: string, role: 'student' | 'assistant') => void;
}

const StudentManagementModal: React.FC<StudentManagementModalProps> = ({
  isOpen,
  onClose,
  project,
  onAddStudent,
  onRemoveStudent,
  onUpdateRole
}) => {
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentRole, setNewStudentRole] = useState<'student' | 'assistant'>('student');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStudentEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    // Check if student already exists
    const existingStudent = project.students?.find(
      (s: any) => s.email.toLowerCase() === newStudentEmail.toLowerCase()
    );

    if (existingStudent) {
      setMessage({ type: 'error', text: 'Student is already in this project' });
      return;
    }

    onAddStudent(newStudentEmail.trim(), newStudentRole);
    setNewStudentEmail('');
    setMessage({ type: 'success', text: 'Student added successfully!' });
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemoveStudent = (studentId: string) => {
    if (confirm('Are you sure you want to remove this student from the project?')) {
      onRemoveStudent(studentId);
      setMessage({ type: 'success', text: 'Student removed successfully!' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const generateInviteLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join/${project.id}`;
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(generateInviteLink());
      setMessage({ type: 'success', text: 'Invite link copied to clipboard!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to copy link' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filteredStudents = project.students?.filter((student: any) =>
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'assistant':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      default:
        return <User className="w-4 h-4 text-blue-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'assistant':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white/90">Manage Students</h2>
              <p className="text-sm text-white/60">{project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Message */}
          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg mb-6 ${
              message.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Add Student Form */}
          <div className="bg-[#2a2a2a] rounded-xl border border-white/10 p-6 mb-6">
            <h3 className="text-lg font-medium text-white/90 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-400" />
              Add Student
            </h3>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Student Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                      type="email"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50"
                      placeholder="student@school.edu"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Role
                  </label>
                  <select
                    value={newStudentRole}
                    onChange={(e) => setNewStudentRole(e.target.value as 'student' | 'assistant')}
                    className="w-full py-2 px-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white/90 focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="student">Student</option>
                    <option value="assistant">Teaching Assistant</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add Student
              </button>
            </form>

            {/* Invite Link Section */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white/90">Share Invite Link</h4>
                <button
                  onClick={() => setShowInviteLink(!showInviteLink)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showInviteLink ? 'Hide' : 'Show'} Link
                </button>
              </div>

              {showInviteLink && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={generateInviteLink()}
                      readOnly
                      className="flex-1 py-2 px-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white/90 text-sm"
                    />
                    <button
                      onClick={copyInviteLink}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      title="Copy Link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-white/50">
                    Students can use this link to join the project directly
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Students List */}
          <div className="bg-[#2a2a2a] rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white/90">
                  Students ({filteredStudents.length})
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50 w-64"
                  />
                </div>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-white/70 mb-2">
                  {searchTerm ? 'No students found' : 'No students yet'}
                </h4>
                <p className="text-white/50">
                  {searchTerm 
                    ? 'Try adjusting your search criteria'
                    : 'Add students to get started with collaborative 3D modeling'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredStudents.map((student: any) => (
                  <div key={student.id} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                          {getRoleIcon(student.role)}
                        </div>
                        <div>
                          <div className="font-medium text-white/90">
                            {student.name || student.email.split('@')[0]}
                          </div>
                          <div className="text-sm text-white/60">{student.email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(student.role)}`}>
                              {getRoleIcon(student.role)}
                              {student.role === 'assistant' ? 'Teaching Assistant' : 'Student'}
                            </div>
                            <div className="text-xs text-white/50 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Joined {formatDate(student.joinedAt)}
                            </div>
                            {student.lastActive && (
                              <div className="text-xs text-white/50 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Active {formatDate(student.lastActive)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={student.role}
                          onChange={(e) => onUpdateRole(student.id, e.target.value as 'student' | 'assistant')}
                          className="py-1 px-2 bg-[#1a1a1a] border border-white/10 rounded text-sm text-white/90 focus:outline-none focus:border-blue-500/50"
                        >
                          <option value="student">Student</option>
                          <option value="assistant">Teaching Assistant</option>
                        </select>
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                          title="Remove Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Access Info */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-400 mb-1">Student Access</div>
                <div className="text-xs text-white/60 space-y-1">
                  <div>• Students can only access this specific project</div>
                  <div>• Each project has completely isolated data and settings</div>
                  <div>• Teaching assistants have additional permissions to help other students</div>
                  <div>• You can modify student permissions in Project Settings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentManagementModal;