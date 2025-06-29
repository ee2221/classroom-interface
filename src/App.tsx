import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import Scene from './components/Scene';
import Toolbar from './components/Toolbar';
import ActionsToolbar from './components/ActionsToolbar';
import LayersPanel from './components/LayersPanel';
import ObjectProperties from './components/ObjectProperties';
import EditControls from './components/EditControls';
import CameraPerspectivePanel from './components/CameraPerspectivePanel';
import LightingPanel from './components/LightingPanel';
import SettingsPanel, { HideInterfaceButton } from './components/SettingsPanel';
import SaveButton from './components/SaveButton';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import ClassroomInterface from './components/ClassroomInterface';
import { useSceneStore } from './store/sceneStore';
import { useClassroomStore } from './store/classroomStore';

function App() {
  const { sceneSettings, setCurrentProject, isLoading } = useSceneStore();
  const { currentProject, setCurrentProject: setClassroomCurrentProject } = useClassroomStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentView, setCurrentView] = useState<'classroom' | 'studio'>('classroom');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Show auth modal if no user is signed in
      if (!user) {
        setShowAuthModal(true);
        setCurrentView('classroom');
        // Clear project data when user signs out
        setCurrentProject(null);
        setClassroomCurrentProject(null);
      } else {
        // Default to classroom view when user signs in
        setCurrentView('classroom');
      }
    });

    return () => unsubscribe();
  }, [setCurrentProject, setClassroomCurrentProject]);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setCurrentView('classroom');
  };

  const handleSignOut = () => {
    setUser(null);
    setShowAuthModal(true);
    setCurrentView('classroom');
    // Clear all project data when signing out
    setCurrentProject(null);
    setClassroomCurrentProject(null);
  };

  const handleProjectSelect = (projectId: string) => {
    // Set the current project in both stores
    const selectedProject = useClassroomStore.getState().projects.find(p => p.id === projectId);
    if (selectedProject && user) {
      setClassroomCurrentProject(selectedProject);
      // Set the project context in scene store - this will clear all data and load project data
      setCurrentProject(projectId, user.uid);
      setCurrentView('studio');
      
      console.log(`Switched to project: ${selectedProject.name} (${projectId})`);
    }
  };

  const handleBackToClassroom = async () => {
    // Save current project data before going back to classroom
    const sceneStore = useSceneStore.getState();
    if (sceneStore.currentProjectId && sceneStore.hasUnsavedChanges) {
      try {
        await sceneStore.saveProjectData();
        console.log('Project data saved before returning to classroom');
      } catch (error) {
        console.error('Failed to save project data:', error);
      }
    }
    
    setCurrentView('classroom');
    // Optionally clear current project or keep it for context
    // setCurrentProject(null);
    // setClassroomCurrentProject(null);
  };

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <div className="w-full h-screen bg-[#0f0f23] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  // Show classroom interface as the main page
  if (!user || currentView === 'classroom') {
    return (
      <div className="w-full h-screen relative bg-[#0f0f23]">
        {/* Authentication Modal */}
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />

        {/* Classroom Interface - Main Page */}
        {user && (
          <ClassroomInterface
            user={user}
            onProjectSelect={handleProjectSelect}
            onClose={() => {}} // No close button needed since this is the main page
            onSignOut={handleSignOut}
          />
        )}

        {/* If no user, show a welcome screen */}
        {!user && !showAuthModal && (
          <div className="w-full h-screen bg-[#0f0f23] flex items-center justify-center">
            <div className="text-center max-w-2xl mx-auto px-6">
              <div className="mb-8">
                <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-white/90 mb-4">
                  3D Modeling Classroom
                </h1>
                <p className="text-xl text-white/70 mb-8">
                  Create, manage, and collaborate on 3D modeling projects in an educational environment
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/10">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white/90 mb-2">Project Management</h3>
                  <p className="text-sm text-white/60">Create and organize multiple 3D modeling projects for different classes and assignments</p>
                </div>
                
                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/10">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white/90 mb-2">Student Collaboration</h3>
                  <p className="text-sm text-white/60">Invite students to projects and enable real-time collaborative 3D modeling</p>
                </div>
                
                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/10">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white/90 mb-2">Secure & Isolated</h3>
                  <p className="text-sm text-white/60">Each project is completely isolated with granular permission controls</p>
                </div>
              </div>

              <button
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show 3D Studio when a project is selected
  return (
    <div className="w-full h-screen relative">
      {/* Loading overlay for project data */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/90 font-medium">Loading project data...</p>
            <p className="text-white/60 text-sm mt-1">Restoring your 3D scene</p>
          </div>
        </div>
      )}

      <Scene />
      
      {/* Top Left Controls - Arranged horizontally */}
      <div className="fixed top-4 left-4 flex items-center gap-4 z-50">
        {/* Hide Interface Button */}
        <HideInterfaceButton />
        
        {/* Back to Classroom Button */}
        <button
          onClick={handleBackToClassroom}
          className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-xl shadow-2xl shadow-black/20 border border-white/5 transition-all duration-200 hover:scale-105 group"
          title="Back to Classroom"
        >
          <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-white/90">Classroom</div>
            <div className="text-xs text-white/60">Back to Projects</div>
          </div>
        </button>
        
        {/* Save Button - When user is authenticated */}
        {user && <SaveButton user={user} projectId={currentProject?.id} />}
        
        {/* User Profile - When user is authenticated */}
        {user && <UserProfile user={user} onSignOut={handleSignOut} />}
      </div>

      {/* Current Project Indicator */}
      {currentProject && (
        <div className="fixed top-4 right-4 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-3 border border-white/5 z-40">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium text-white/90">{currentProject.name}</span>
            <div className="text-xs text-white/60 ml-2">
              {currentProject.students?.length || 0} students
            </div>
          </div>
        </div>
      )}
      
      {/* Conditionally render UI panels based on hideAllMenus setting */}
      {!sceneSettings.hideAllMenus && (
        <>
          <ActionsToolbar />
          <Toolbar />
          <LayersPanel />
          <ObjectProperties />
          <EditControls />
          <CameraPerspectivePanel />
          <LightingPanel />
        </>
      )}
      
      {/* Settings panel is always visible */}
      <SettingsPanel />
    </div>
  );
}

export default App;