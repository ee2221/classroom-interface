import { create } from 'zustand';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface Student {
  id: string;
  email: string;
  name?: string;
  role: 'student' | 'assistant';
  joinedAt: Date;
  lastActive?: Date;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  teacherName: string;
  status: 'active' | 'archived' | 'draft';
  isFavorite: boolean;
  students: Student[];
  settings: {
    allowStudentEdit: boolean;
    allowStudentShare: boolean;
    maxObjects: number;
    enableCollaboration: boolean;
    autoSave: boolean;
  };
  objectCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ClassroomState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filterStatus: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
  selectedProjects: string[];
  
  // Actions
  setSearchTerm: (term: string) => void;
  setFilterStatus: (status: string) => void;
  setSortBy: (sortBy: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSelectedProjects: (ids: string[]) => void;
  setCurrentProject: (project: Project | null) => void;
  
  // Project management
  loadProjects: (teacherId: string) => Promise<void>;
  createProject: (projectData: Partial<Project>) => Promise<void>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  duplicateProject: (projectId: string) => Promise<void>;
  archiveProject: (projectId: string) => Promise<void>;
  toggleProjectFavorite: (projectId: string) => Promise<void>;
  
  // Student management
  addStudentToProject: (projectId: string, email: string, role: 'student' | 'assistant') => Promise<void>;
  removeStudentFromProject: (projectId: string, studentId: string) => Promise<void>;
  updateStudentRole: (projectId: string, studentId: string, role: 'student' | 'assistant') => Promise<void>;
  
  // Import/Export
  exportProject: (projectId: string) => Promise<void>;
  importProject: (projectData: any) => Promise<void>;
}

export const useClassroomStore = create<ClassroomState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  searchTerm: '',
  filterStatus: 'all',
  sortBy: 'updated',
  viewMode: 'grid',
  selectedProjects: [],

  setSearchTerm: (term) => set({ searchTerm: term }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSortBy: (sortBy) => set({ sortBy }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedProjects: (ids) => set({ selectedProjects: ids }),
  setCurrentProject: (project) => set({ currentProject: project }),

  loadProjects: async (teacherId: string) => {
    set({ loading: true, error: null });
    try {
      // First, try the optimized query with composite index
      let projects: Project[] = [];
      
      try {
        const q = query(
          collection(db, 'classroom_projects'),
          where('teacherId', '==', teacherId),
          orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        projects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Project[];
      } catch (indexError) {
        // If composite index doesn't exist, fall back to simple query and sort in memory
        console.warn('Composite index not available, using fallback query. Please create the index at:', 
          'https://console.firebase.google.com/v1/r/project/steam-ic-3d-modeling-prototype/firestore/indexes');
        
        const q = query(
          collection(db, 'classroom_projects'),
          where('teacherId', '==', teacherId)
        );
        
        const querySnapshot = await getDocs(q);
        projects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Project[];
        
        // Sort in memory by updatedAt descending
        projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      }

      set({ projects, loading: false });
    } catch (error) {
      console.error('Error loading projects:', error);
      set({ error: 'Failed to load projects', loading: false });
    }
  },

  createProject: async (projectData) => {
    set({ loading: true, error: null });
    try {
      const newProject = {
        ...projectData,
        status: 'active',
        isFavorite: false,
        students: [],
        settings: {
          allowStudentEdit: true,
          allowStudentShare: false,
          maxObjects: 100,
          enableCollaboration: true,
          autoSave: true,
          ...projectData.settings
        },
        objectCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'classroom_projects'), newProject);
      
      // Reload projects to get the new one
      if (projectData.teacherId) {
        await get().loadProjects(projectData.teacherId);
      }
      
      set({ loading: false });
    } catch (error) {
      console.error('Error creating project:', error);
      set({ error: 'Failed to create project', loading: false });
    }
  },

  updateProject: async (projectId, data) => {
    try {
      const projectRef = doc(db, 'classroom_projects', projectId);
      await updateDoc(projectRef, {
        ...data,
        updatedAt: serverTimestamp()
      });

      // Update local state
      set(state => ({
        projects: state.projects.map(project =>
          project.id === projectId
            ? { ...project, ...data, updatedAt: new Date() }
            : project
        ),
        currentProject: state.currentProject?.id === projectId
          ? { ...state.currentProject, ...data, updatedAt: new Date() }
          : state.currentProject
      }));
    } catch (error) {
      console.error('Error updating project:', error);
      set({ error: 'Failed to update project' });
    }
  },

  deleteProject: async (projectId) => {
    try {
      await deleteDoc(doc(db, 'classroom_projects', projectId));
      
      set(state => ({
        projects: state.projects.filter(project => project.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject
      }));
    } catch (error) {
      console.error('Error deleting project:', error);
      set({ error: 'Failed to delete project' });
    }
  },

  duplicateProject: async (projectId) => {
    try {
      const state = get();
      const originalProject = state.projects.find(p => p.id === projectId);
      if (!originalProject) return;

      const duplicatedProject = {
        ...originalProject,
        name: `${originalProject.name} (Copy)`,
        students: [], // Don't copy students
        objectCount: 0, // Reset object count
        isFavorite: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      delete duplicatedProject.id;

      await addDoc(collection(db, 'classroom_projects'), duplicatedProject);
      
      // Reload projects
      await get().loadProjects(originalProject.teacherId);
    } catch (error) {
      console.error('Error duplicating project:', error);
      set({ error: 'Failed to duplicate project' });
    }
  },

  archiveProject: async (projectId) => {
    try {
      const state = get();
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return;

      const newStatus = project.status === 'archived' ? 'active' : 'archived';
      await get().updateProject(projectId, { status: newStatus });
    } catch (error) {
      console.error('Error archiving project:', error);
      set({ error: 'Failed to archive project' });
    }
  },

  toggleProjectFavorite: async (projectId) => {
    try {
      const state = get();
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return;

      await get().updateProject(projectId, { isFavorite: !project.isFavorite });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      set({ error: 'Failed to update favorite status' });
    }
  },

  addStudentToProject: async (projectId, email, role) => {
    try {
      const state = get();
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return;

      const newStudent: Student = {
        id: crypto.randomUUID(),
        email,
        role,
        joinedAt: new Date()
      };

      const updatedStudents = [...project.students, newStudent];
      await get().updateProject(projectId, { students: updatedStudents });
    } catch (error) {
      console.error('Error adding student:', error);
      set({ error: 'Failed to add student' });
    }
  },

  removeStudentFromProject: async (projectId, studentId) => {
    try {
      const state = get();
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return;

      const updatedStudents = project.students.filter(s => s.id !== studentId);
      await get().updateProject(projectId, { students: updatedStudents });
    } catch (error) {
      console.error('Error removing student:', error);
      set({ error: 'Failed to remove student' });
    }
  },

  updateStudentRole: async (projectId, studentId, role) => {
    try {
      const state = get();
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return;

      const updatedStudents = project.students.map(student =>
        student.id === studentId ? { ...student, role } : student
      );
      await get().updateProject(projectId, { students: updatedStudents });
    } catch (error) {
      console.error('Error updating student role:', error);
      set({ error: 'Failed to update student role' });
    }
  },

  exportProject: async (projectId) => {
    try {
      // Implementation for exporting project data
      console.log('Exporting project:', projectId);
    } catch (error) {
      console.error('Error exporting project:', error);
      set({ error: 'Failed to export project' });
    }
  },

  importProject: async (projectData) => {
    try {
      // Implementation for importing project data
      console.log('Importing project:', projectData);
    } catch (error) {
      console.error('Error importing project:', error);
      set({ error: 'Failed to import project' });
    }
  }
}));