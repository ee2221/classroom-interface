import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Mail,
  Link,
  QrCode,
  Download,
  Globe,
  Lock,
  Users,
  Eye,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [shareMethod, setShareMethod] = useState<'link' | 'email' | 'qr'>('link');
  const [emailList, setEmailList] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit'>('view');

  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/project/${project.id}?access=${accessLevel}`;
  };

  const generateJoinLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join/${project.id}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'success', text: `${label} copied to clipboard!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to copy to clipboard' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const sendEmailInvites = () => {
    const emails = emailList.split(',').map(email => email.trim()).filter(email => email);
    
    if (emails.length === 0) {
      setMessage({ type: 'error', text: 'Please enter at least one email address' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // In a real implementation, this would send emails via a backend service
    const subject = `Invitation to join ${project.name} - 3D Modeling Project`;
    const body = `You've been invited to join the 3D modeling project "${project.name}".

Click the link below to join:
${generateJoinLink()}

Project Description: ${project.description || 'No description provided'}

This project allows you to create and explore 3D models in a collaborative environment.`;

    const mailtoLink = `mailto:${emails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    
    setMessage({ type: 'success', text: 'Email client opened with invitation' });
    setTimeout(() => setMessage(null), 3000);
  };

  const generateQRCode = () => {
    // In a real implementation, you would use a QR code library
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateJoinLink())}`;
    return qrUrl;
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Share2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white/90">Share Project</h2>
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

          {/* Share Method Tabs */}
          <div className="flex bg-[#2a2a2a] rounded-lg p-1 mb-6">
            <button
              onClick={() => setShareMethod('link')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors flex-1 justify-center ${
                shareMethod === 'link' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-white/70 hover:text-white/90'
              }`}
            >
              <Link className="w-4 h-4" />
              Share Link
            </button>
            <button
              onClick={() => setShareMethod('email')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors flex-1 justify-center ${
                shareMethod === 'email' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-white/70 hover:text-white/90'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email Invite
            </button>
            <button
              onClick={() => setShareMethod('qr')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors flex-1 justify-center ${
                shareMethod === 'qr' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-white/70 hover:text-white/90'
              }`}
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </button>
          </div>

          {/* Access Level Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/70 mb-3">
              Access Level
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAccessLevel('view')}
                className={`p-4 rounded-lg border transition-all ${
                  accessLevel === 'view'
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-white/10 bg-[#2a2a2a] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <span className="font-medium text-white/90">View Only</span>
                </div>
                <p className="text-sm text-white/60 text-left">
                  Recipients can view the project but cannot make changes
                </p>
              </button>
              <button
                onClick={() => setAccessLevel('edit')}
                className={`p-4 rounded-lg border transition-all ${
                  accessLevel === 'edit'
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-white/10 bg-[#2a2a2a] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-green-400" />
                  <span className="font-medium text-white/90">Collaborate</span>
                </div>
                <p className="text-sm text-white/60 text-left">
                  Recipients can view and edit the project
                </p>
              </button>
            </div>
          </div>

          {/* Share Content */}
          {shareMethod === 'link' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generateShareLink()}
                    readOnly
                    className="flex-1 py-2 px-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white/90 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(generateShareLink(), 'Share link')}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    title="Copy Link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.open(generateShareLink(), '_blank')}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    title="Open Link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Join Link (for students)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generateJoinLink()}
                    readOnly
                    className="flex-1 py-2 px-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white/90 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(generateJoinLink(), 'Join link')}
                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    title="Copy Join Link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Students can use this link to request access to join the project
                </p>
              </div>
            </div>
          )}

          {shareMethod === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Email Addresses
                </label>
                <textarea
                  value={emailList}
                  onChange={(e) => setEmailList(e.target.value)}
                  rows={4}
                  className="w-full py-2 px-3 bg-[#2a2a2a] border border-white/10 rounded-lg text-white/90 placeholder-white/50 focus:outline-none focus:border-blue-500/50 resize-none"
                  placeholder="Enter email addresses separated by commas&#10;student1@school.edu, student2@school.edu"
                />
                <p className="text-xs text-white/50 mt-1">
                  Separate multiple email addresses with commas
                </p>
              </div>

              <button
                onClick={sendEmailInvites}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send Invitations
              </button>
            </div>
          )}

          {shareMethod === 'qr' && (
            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-white rounded-lg">
                <img
                  src={generateQRCode()}
                  alt="QR Code for project access"
                  className="w-48 h-48"
                />
              </div>
              <div>
                <p className="text-sm text-white/70 mb-2">
                  Scan this QR code to access the project
                </p>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generateQRCode();
                    link.download = `${project.name}-qr-code.png`;
                    link.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors mx-auto"
                >
                  <Download className="w-4 h-4" />
                  Download QR Code
                </button>
              </div>
            </div>
          )}

          {/* Project Info */}
          <div className="mt-6 p-4 bg-[#2a2a2a] rounded-lg border border-white/10">
            <h4 className="text-sm font-medium text-white/90 mb-3">Project Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Name:</span>
                <span className="text-white/90">{project.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Students:</span>
                <span className="text-white/90">{project.students?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Status:</span>
                <span className={`capitalize ${
                  project.status === 'active' ? 'text-green-400' : 
                  project.status === 'archived' ? 'text-gray-400' : 'text-yellow-400'
                }`}>
                  {project.status}
                </span>
              </div>
              {project.description && (
                <div>
                  <span className="text-white/60">Description:</span>
                  <p className="text-white/90 mt-1">{project.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-orange-400 mb-1">Security Notice</div>
                <div className="text-xs text-white/60 space-y-1">
                  <div>• Only share links with trusted individuals</div>
                  <div>• You can revoke access at any time through project settings</div>
                  <div>• All project data remains isolated from other projects</div>
                  <div>• Students with edit access can modify project content</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareProjectModal;