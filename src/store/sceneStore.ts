import { create } from 'zustand';
import * as THREE from 'three';
import {
  saveObject,
  updateObject,
  deleteObject,
  saveGroup,
  updateGroup,
  deleteGroup,
  saveLight,
  updateLight,
  deleteLight,
  getObjects,
  getGroups,
  getLights,
  subscribeToObjects,
  subscribeToGroups,
  subscribeToLights,
  objectToFirestore,
  firestoreToObject,
  FirestoreObject,
  FirestoreGroup,
  FirestoreLight
} from '../services/firestoreService';

type EditMode = 'vertex' | 'edge' | null;
type CameraPerspective = 'perspective' | 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

interface Light {
  id: string;
  name: string;
  type: 'directional' | 'point' | 'spot';
  position: number[];
  target: number[];
  intensity: number;
  color: string;
  visible: boolean;
  castShadow: boolean;
  distance: number;
  decay: number;
  angle: number;
  penumbra: number;
  object?: THREE.Light;
  firestoreId?: string; // Track Firestore document ID
}

interface Group {
  id: string;
  name: string;
  expanded: boolean;
  visible: boolean;
  locked: boolean;
  objectIds: string[];
  firestoreId?: string; // Track Firestore document ID
}

interface SceneSettings {
  backgroundColor: string;
  showGrid: boolean;
  gridSize: number;
  gridDivisions: number;
  hideAllMenus: boolean;
}

interface HistoryState {
  objects: Array<{
    id: string;
    object: THREE.Object3D;
    name: string;
    visible: boolean;
    locked: boolean;
    groupId?: string;
    firestoreId?: string;
  }>;
  groups: Group[];
  lights: Light[];
}

interface SceneState {
  objects: Array<{
    id: string;
    object: THREE.Object3D;
    name: string;
    visible: boolean;
    locked: boolean;
    groupId?: string;
    firestoreId?: string; // Track Firestore document ID
  }>;
  groups: Group[];
  lights: Light[];
  selectedLight: Light | null;
  selectedObject: THREE.Object3D | null;
  transformMode: 'translate' | 'rotate' | 'scale' | null;
  editMode: EditMode;
  cameraPerspective: CameraPerspective;
  cameraZoom: number;
  sceneSettings: SceneSettings;
  // New persistent mode settings
  persistentTransformMode: 'translate' | 'rotate' | 'scale' | null;
  persistentEditMode: EditMode;
  selectedElements: {
    vertices: number[];
    edges: number[];
    faces: number[];
  };
  draggedVertex: {
    indices: number[];
    position: THREE.Vector3;
    initialPosition: THREE.Vector3;
  } | null;
  draggedEdge: {
    indices: number[][];
    positions: THREE.Vector3[];
    initialPositions: THREE.Vector3[];
    connectedVertices: Set<number>;
    midpoint: THREE.Vector3;
  } | null;
  isDraggingEdge: boolean;
  history: HistoryState[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  // New placement state
  placementMode: boolean;
  pendingObject: {
    geometry: () => THREE.BufferGeometry | THREE.Group;
    name: string;
    color?: string;
  } | null;
  // Save state and project context
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  currentProjectId: string | null;
  currentUserId: string | null;
  isLoading: boolean;
  // Real-time sync state
  unsubscribeObjects?: () => void;
  unsubscribeGroups?: () => void;
  unsubscribeLights?: () => void;
  
  // Project management
  setCurrentProject: (projectId: string | null, userId: string | null) => Promise<void>;
  loadProjectData: () => Promise<void>;
  saveProjectData: () => Promise<void>;
  clearProjectData: () => void;
  
  addObject: (object: THREE.Object3D, name: string) => Promise<void>;
  removeObject: (id: string) => Promise<void>;
  setSelectedObject: (object: THREE.Object3D | null) => void;
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale' | null) => void;
  setEditMode: (mode: EditMode) => void;
  setCameraPerspective: (perspective: CameraPerspective) => void;
  updateSceneSettings: (settings: Partial<SceneSettings>) => void;
  toggleVisibility: (id: string) => Promise<void>;
  toggleLock: (id: string) => Promise<void>;
  updateObjectName: (id: string, name: string) => Promise<void>;
  updateObjectProperties: () => Promise<void>;
  updateObjectColor: (color: string) => Promise<void>;
  updateObjectOpacity: (opacity: number) => Promise<void>;
  setSelectedElements: (type: 'vertices' | 'edges' | 'faces', indices: number[]) => void;
  startVertexDrag: (index: number, position: THREE.Vector3) => void;
  updateVertexDrag: (position: THREE.Vector3) => void;
  endVertexDrag: () => void;
  startEdgeDrag: (vertexIndices: number[], positions: THREE.Vector3[], midpoint: THREE.Vector3) => void;
  updateEdgeDrag: (position: THREE.Vector3) => void;
  endEdgeDrag: () => void;
  setIsDraggingEdge: (isDragging: boolean) => void;
  updateCylinderVertices: (vertexCount: number) => void;
  updateSphereVertices: (vertexCount: number) => void;
  // Group management
  createGroup: (name: string, objectIds?: string[]) => Promise<void>;
  removeGroup: (groupId: string) => Promise<void>;
  addObjectToGroup: (objectId: string, groupId: string) => Promise<void>;
  removeObjectFromGroup: (objectId: string) => Promise<void>;
  toggleGroupExpanded: (groupId: string) => void;
  toggleGroupVisibility: (groupId: string) => Promise<void>;
  toggleGroupLock: (groupId: string) => Promise<void>;
  updateGroupName: (groupId: string, name: string) => Promise<void>;
  moveObjectsToGroup: (objectIds: string[], groupId: string | null) => Promise<void>;
  // New action functions
  undo: () => void;
  redo: () => void;
  duplicateObject: () => Promise<void>;
  mirrorObject: () => Promise<void>;
  zoomIn: () => void;
  zoomOut: () => void;
  // Enhanced placement functions
  startObjectPlacement: (objectDef: { geometry: () => THREE.BufferGeometry | THREE.Group; name: string; color?: string }) => void;
  placeObjectAt: (position: THREE.Vector3, rotation?: THREE.Euler | null) => Promise<void>;
  cancelObjectPlacement: () => void;
  // Light management functions
  addLight: (type: 'directional' | 'point' | 'spot', position?: number[]) => Promise<void>;
  removeLight: (lightId: string) => Promise<void>;
  updateLight: (lightId: string, properties: Partial<Light>) => Promise<void>;
  toggleLightVisibility: (lightId: string) => Promise<void>;
  setSelectedLight: (light: Light | null) => void;
  // Helper functions
  isObjectLocked: (objectId: string) => boolean;
  canSelectObject: (object: THREE.Object3D) => boolean;
  saveToHistory: () => void;
  // Save functions
  markSaved: () => void;
  markUnsavedChanges: () => void;
}

const cloneObject = (obj: THREE.Object3D): THREE.Object3D => {
  if (obj instanceof THREE.Mesh) {
    const clonedGeometry = obj.geometry.clone();
    const clonedMaterial = obj.material instanceof Array 
      ? obj.material.map(mat => mat.clone())
      : obj.material.clone();
    const clonedMesh = new THREE.Mesh(clonedGeometry, clonedMaterial);
    
    clonedMesh.position.copy(obj.position);
    clonedMesh.rotation.copy(obj.rotation);
    clonedMesh.scale.copy(obj.scale);
    
    return clonedMesh;
  }
  return obj.clone();
};

const createLight = (type: 'directional' | 'point' | 'spot', position: number[], target: number[] = [0, 0, 0]): THREE.Light => {
  let light: THREE.Light;
  
  switch (type) {
    case 'directional':
      light = new THREE.DirectionalLight('#ffffff', 1);
      light.position.set(...position);
      (light as THREE.DirectionalLight).target.position.set(...target);
      break;
    case 'point':
      light = new THREE.PointLight('#ffffff', 1, 0, 2);
      light.position.set(...position);
      break;
    case 'spot':
      light = new THREE.SpotLight('#ffffff', 1, 0, Math.PI / 3, 0, 2);
      light.position.set(...position);
      (light as THREE.SpotLight).target.position.set(...target);
      break;
    default:
      light = new THREE.PointLight('#ffffff', 1);
      light.position.set(...position);
  }
  
  light.castShadow = true;
  return light;
};

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: [],
  groups: [],
  lights: [],
  selectedLight: null,
  selectedObject: null,
  transformMode: null,
  editMode: null,
  cameraPerspective: 'perspective',
  cameraZoom: 1,
  sceneSettings: {
    backgroundColor: '#0f0f23',
    showGrid: true,
    gridSize: 10,
    gridDivisions: 10,
    hideAllMenus: false
  },
  // New persistent mode settings
  persistentTransformMode: null,
  persistentEditMode: null,
  selectedElements: {
    vertices: [],
    edges: [],
    faces: [],
  },
  draggedVertex: null,
  draggedEdge: null,
  isDraggingEdge: false,
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  // New placement state
  placementMode: false,
  pendingObject: null,
  // Save state and project context
  lastSaved: null,
  hasUnsavedChanges: false,
  currentProjectId: null,
  currentUserId: null,
  isLoading: false,

  // Project management functions
  setCurrentProject: async (projectId, userId) => {
    const state = get();
    
    // Clean up existing subscriptions
    if (state.unsubscribeObjects) state.unsubscribeObjects();
    if (state.unsubscribeGroups) state.unsubscribeGroups();
    if (state.unsubscribeLights) state.unsubscribeLights();
    
    // Clear current data
    set({
      objects: [],
      groups: [],
      lights: [],
      selectedObject: null,
      selectedLight: null,
      currentProjectId: projectId,
      currentUserId: userId,
      isLoading: !!projectId,
      unsubscribeObjects: undefined,
      unsubscribeGroups: undefined,
      unsubscribeLights: undefined
    });

    if (projectId && userId) {
      try {
        console.log(`Loading project data for project: ${projectId}`);
        
        // Set up real-time subscriptions
        const unsubObjects = subscribeToObjects(userId, projectId, (firestoreObjects) => {
          console.log(`Received ${firestoreObjects.length} objects from Firestore`);
          
          const threeObjects = firestoreObjects.map(firestoreObj => {
            const threeObject = firestoreToObject(firestoreObj);
            if (threeObject && firestoreObj.id) {
              return {
                id: crypto.randomUUID(), // Local ID for scene management
                object: threeObject,
                name: firestoreObj.name,
                visible: firestoreObj.visible,
                locked: firestoreObj.locked,
                groupId: firestoreObj.groupId,
                firestoreId: firestoreObj.id // Track Firestore document ID
              };
            }
            return null;
          }).filter(Boolean) as Array<{
            id: string;
            object: THREE.Object3D;
            name: string;
            visible: boolean;
            locked: boolean;
            groupId?: string;
            firestoreId?: string;
          }>;

          set(state => ({ 
            ...state, 
            objects: threeObjects,
            isLoading: false 
          }));
        });

        const unsubGroups = subscribeToGroups(userId, projectId, (firestoreGroups) => {
          console.log(`Received ${firestoreGroups.length} groups from Firestore`);
          
          const groups = firestoreGroups.map(group => ({
            ...group,
            id: group.id || crypto.randomUUID(),
            firestoreId: group.id
          }));

          set(state => ({ ...state, groups }));
        });

        const unsubLights = subscribeToLights(userId, projectId, (firestoreLights) => {
          console.log(`Received ${firestoreLights.length} lights from Firestore`);
          
          const lights = firestoreLights.map(light => ({
            ...light,
            id: light.id || crypto.randomUUID(),
            object: createLight(light.type, light.position, light.target),
            firestoreId: light.id
          }));

          set(state => ({ ...state, lights }));
        });

        set({
          unsubscribeObjects: unsubObjects,
          unsubscribeGroups: unsubGroups,
          unsubscribeLights: unsubLights
        });

      } catch (error) {
        console.error('Failed to load project data:', error);
        set({ isLoading: false });
      }
    }
  },

  loadProjectData: async () => {
    const { currentProjectId, currentUserId } = get();
    if (!currentProjectId || !currentUserId) return;

    set({ isLoading: true });
    
    try {
      const [firestoreObjects, firestoreGroups, firestoreLights] = await Promise.all([
        getObjects(currentUserId, currentProjectId),
        getGroups(currentUserId, currentProjectId),
        getLights(currentUserId, currentProjectId)
      ]);

      // Convert Firestore objects to THREE.js objects
      const threeObjects = firestoreObjects.map(firestoreObj => {
        const threeObject = firestoreToObject(firestoreObj);
        if (threeObject && firestoreObj.id) {
          return {
            id: crypto.randomUUID(),
            object: threeObject,
            name: firestoreObj.name,
            visible: firestoreObj.visible,
            locked: firestoreObj.locked,
            groupId: firestoreObj.groupId,
            firestoreId: firestoreObj.id
          };
        }
        return null;
      }).filter(Boolean) as Array<{
        id: string;
        object: THREE.Object3D;
        name: string;
        visible: boolean;
        locked: boolean;
        groupId?: string;
        firestoreId?: string;
      }>;

      // Convert Firestore groups
      const groups = firestoreGroups.map(group => ({
        ...group,
        id: group.id || crypto.randomUUID(),
        firestoreId: group.id
      }));

      // Convert Firestore lights
      const lights = firestoreLights.map(light => ({
        ...light,
        id: light.id || crypto.randomUUID(),
        object: createLight(light.type, light.position, light.target),
        firestoreId: light.id
      }));

      set({
        objects: threeObjects,
        groups,
        lights,
        isLoading: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false
      });

      console.log(`Loaded project data: ${threeObjects.length} objects, ${groups.length} groups, ${lights.length} lights`);
    } catch (error) {
      console.error('Error loading project data:', error);
      set({ isLoading: false });
    }
  },

  saveProjectData: async () => {
    const { objects, groups, lights, currentProjectId, currentUserId } = get();
    
    if (!currentProjectId || !currentUserId) {
      throw new Error('No project or user context for saving');
    }

    try {
      // Save all objects
      const objectPromises = objects.map(async (obj) => {
        const firestoreData = objectToFirestore(obj.object, obj.name, obj.firestoreId, currentUserId, currentProjectId);
        firestoreData.visible = obj.visible;
        firestoreData.locked = obj.locked;
        if (obj.groupId !== undefined) {
          firestoreData.groupId = obj.groupId;
        }

        if (obj.firestoreId) {
          // Update existing object
          await updateObject(obj.firestoreId, firestoreData, currentUserId, currentProjectId);
          return obj.firestoreId;
        } else {
          // Create new object
          const newId = await saveObject(firestoreData, currentUserId, currentProjectId);
          // Update local object with Firestore ID
          obj.firestoreId = newId;
          return newId;
        }
      });

      // Save all groups
      const groupPromises = groups.map(async (group) => {
        const firestoreGroup: FirestoreGroup = {
          name: group.name,
          expanded: group.expanded,
          visible: group.visible,
          locked: group.locked,
          objectIds: group.objectIds
        };

        if (group.firestoreId) {
          await updateGroup(group.firestoreId, firestoreGroup, currentUserId, currentProjectId);
          return group.firestoreId;
        } else {
          const newId = await saveGroup(firestoreGroup, currentUserId, currentProjectId);
          group.firestoreId = newId;
          return newId;
        }
      });

      // Save all lights
      const lightPromises = lights.map(async (light) => {
        const firestoreLight: FirestoreLight = {
          name: light.name,
          type: light.type,
          position: light.position,
          target: light.target,
          intensity: light.intensity,
          color: light.color,
          visible: light.visible,
          castShadow: light.castShadow,
          distance: light.distance,
          decay: light.decay,
          angle: light.angle,
          penumbra: light.penumbra
        };

        if (light.firestoreId) {
          await updateLight(light.firestoreId, firestoreLight, currentUserId, currentProjectId);
          return light.firestoreId;
        } else {
          const newId = await saveLight(firestoreLight, currentUserId, currentProjectId);
          light.firestoreId = newId;
          return newId;
        }
      });

      // Wait for all saves to complete
      await Promise.all([
        ...objectPromises,
        ...groupPromises,
        ...lightPromises
      ]);

      set({
        lastSaved: new Date(),
        hasUnsavedChanges: false
      });

      console.log(`Saved project data: ${objects.length} objects, ${groups.length} groups, ${lights.length} lights`);
    } catch (error) {
      console.error('Error saving project data:', error);
      throw error;
    }
  },

  clearProjectData: () => {
    const state = get();
    
    // Clean up subscriptions
    if (state.unsubscribeObjects) state.unsubscribeObjects();
    if (state.unsubscribeGroups) state.unsubscribeGroups();
    if (state.unsubscribeLights) state.unsubscribeLights();
    
    set({
      objects: [],
      groups: [],
      lights: [],
      selectedObject: null,
      selectedLight: null,
      currentProjectId: null,
      currentUserId: null,
      lastSaved: null,
      hasUnsavedChanges: false,
      unsubscribeObjects: undefined,
      unsubscribeGroups: undefined,
      unsubscribeLights: undefined
    });
  },

  updateSceneSettings: (settings) =>
    set((state) => {
      get().markUnsavedChanges();
      return {
        sceneSettings: { ...state.sceneSettings, ...settings }
      };
    }),

  saveToHistory: () => {
    const state = get();
    const currentState: HistoryState = {
      objects: state.objects.map(obj => ({
        ...obj,
        object: cloneObject(obj.object)
      })),
      groups: JSON.parse(JSON.stringify(state.groups)),
      lights: JSON.parse(JSON.stringify(state.lights.map(light => ({
        ...light,
        object: undefined // Don't clone the THREE.js object
      }))))
    };

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(currentState);

    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: true,
      canRedo: false
    });
    
    get().markUnsavedChanges();
  },

  addObject: async (object, name) => {
    const { currentProjectId, currentUserId } = get();
    
    const newObject = { 
      id: crypto.randomUUID(), 
      object, 
      name, 
      visible: true, 
      locked: false 
    };

    // Add to local state immediately
    set((state) => ({
      objects: [...state.objects, newObject]
    }));

    // Save to database if we have project context
    if (currentProjectId && currentUserId) {
      try {
        const firestoreData = objectToFirestore(object, name, undefined, currentUserId, currentProjectId);
        firestoreData.visible = true;
        firestoreData.locked = false;
        
        const firestoreId = await saveObject(firestoreData, currentUserId, currentProjectId);
        
        // Update local object with Firestore ID
        set((state) => ({
          objects: state.objects.map(obj => 
            obj.id === newObject.id 
              ? { ...obj, firestoreId }
              : obj
          )
        }));
        
        console.log(`Object "${name}" saved to database with ID: ${firestoreId}`);
      } catch (error) {
        console.error('Failed to save object to database:', error);
        // Object remains in local state even if database save fails
      }
    }

    // Save to history after adding
    setTimeout(() => get().saveToHistory(), 0);
  },

  removeObject: async (id) => {
    const state = get();
    const objectToRemove = state.objects.find(obj => obj.id === id);
    
    if (!objectToRemove) return;

    // Check if object is locked
    if (objectToRemove.locked) return;

    // Check if object is in a locked group
    if (objectToRemove.groupId) {
      const group = state.groups.find(g => g.id === objectToRemove.groupId);
      if (group?.locked) return;
    }

    // Remove from database immediately if we have Firestore ID and project context
    if (objectToRemove.firestoreId && state.currentProjectId) {
      try {
        await deleteObject(objectToRemove.firestoreId, state.currentProjectId);
        console.log(`Object "${objectToRemove.name}" deleted from database`);
      } catch (error) {
        console.error('Failed to delete object from database:', error);
        // Continue with local removal even if database deletion fails
      }
    }

    // Remove object from any group
    const updatedGroups = state.groups.map(group => ({
      ...group,
      objectIds: group.objectIds.filter(objId => objId !== id)
    }));

    // Remove from local state
    set({
      objects: state.objects.filter((obj) => obj.id !== id),
      groups: updatedGroups,
      selectedObject: objectToRemove.object === state.selectedObject ? null : state.selectedObject,
    });

    // Save to history after removing
    setTimeout(() => get().saveToHistory(), 0);
  },

  setSelectedObject: (object) => 
    set((state) => {
      // Check if object can be selected (not locked)
      if (object && !get().canSelectObject(object)) {
        return state; // Don't change selection if object is locked
      }

      let newEditMode = state.editMode;

      if (object) {
        // Apply persistent edit mode if set
        if (state.persistentEditMode) {
          newEditMode = state.persistentEditMode;
        } else {
          // Auto-enable vertex mode for sphere, cylinder, and cone
          if (object instanceof THREE.Mesh) {
            const geometry = object.geometry;
            if (geometry instanceof THREE.SphereGeometry ||
                geometry instanceof THREE.CylinderGeometry ||
                geometry instanceof THREE.ConeGeometry) {
              newEditMode = 'vertex';
            }
          }
        }
      } else {
        // When deselecting, clear edit mode but keep persistent modes
        newEditMode = null;
      }
      
      return { 
        selectedObject: object,
        editMode: newEditMode,
        // Don't automatically set transform mode - only show when explicitly selected
        transformMode: object ? state.transformMode : null
      };
    }),

  setTransformMode: (mode) => 
    set((state) => {
      // Update both current and persistent transform mode
      return {
        transformMode: mode,
        persistentTransformMode: mode // Remember this choice for future selections
      };
    }),
  
  setEditMode: (mode) => 
    set((state) => {
      // If trying to set edge mode on unsupported geometry, prevent it
      if (mode === 'edge' && state.selectedObject instanceof THREE.Mesh) {
        const geometry = state.selectedObject.geometry;
        if (geometry instanceof THREE.CylinderGeometry ||
            geometry instanceof THREE.ConeGeometry ||
            geometry instanceof THREE.SphereGeometry) {
          return state; // Don't change the edit mode
        }
      }

      // Update both current and persistent edit mode
      return { 
        editMode: mode,
        persistentEditMode: mode // Remember this choice for future selections
      };
    }),

  setCameraPerspective: (perspective) => {
    get().markUnsavedChanges();
    set({ cameraPerspective: perspective });
  },

  toggleVisibility: async (id) => {
    const state = get();
    const objectToToggle = state.objects.find(obj => obj.id === id);
    if (!objectToToggle) return;

    // Check if object is locked
    if (objectToToggle.locked) return;

    // Check if object is in a locked group
    if (objectToToggle.groupId) {
      const group = state.groups.find(g => g.id === objectToToggle.groupId);
      if (group?.locked) return;
    }

    const newVisibility = !objectToToggle.visible;

    // Update in database immediately if we have Firestore ID and project context
    if (objectToToggle.firestoreId && state.currentProjectId && state.currentUserId) {
      try {
        await updateObject(
          objectToToggle.firestoreId, 
          { visible: newVisibility }, 
          state.currentUserId, 
          state.currentProjectId
        );
        console.log(`Object "${objectToToggle.name}" visibility updated in database`);
      } catch (error) {
        console.error('Failed to update object visibility in database:', error);
      }
    }

    // Update local state
    const updatedObjects = state.objects.map((obj) =>
      obj.id === id ? { ...obj, visible: newVisibility } : obj
    );
    
    const toggledObject = updatedObjects.find((obj) => obj.id === id);
    const newSelectedObject = (toggledObject && !toggledObject.visible && toggledObject.object === state.selectedObject)
      ? null
      : state.selectedObject;

    set({
      objects: updatedObjects,
      selectedObject: newSelectedObject,
    });

    get().markUnsavedChanges();
  },

  toggleLock: async (id) => {
    const state = get();
    const objectToToggle = state.objects.find(obj => obj.id === id);
    if (!objectToToggle) return;

    // Check if object is in a locked group
    if (objectToToggle.groupId) {
      const group = state.groups.find(g => g.id === objectToToggle.groupId);
      if (group?.locked) return;
    }

    const newLockState = !objectToToggle.locked;

    // Update in database immediately if we have Firestore ID and project context
    if (objectToToggle.firestoreId && state.currentProjectId && state.currentUserId) {
      try {
        await updateObject(
          objectToToggle.firestoreId, 
          { locked: newLockState }, 
          state.currentUserId, 
          state.currentProjectId
        );
        console.log(`Object "${objectToToggle.name}" lock state updated in database`);
      } catch (error) {
        console.error('Failed to update object lock state in database:', error);
      }
    }

    // Update local state
    const updatedObjects = state.objects.map((obj) =>
      obj.id === id ? { ...obj, locked: newLockState } : obj
    );
    
    const toggledObject = updatedObjects.find((obj) => obj.id === id);
    const newSelectedObject = (toggledObject && toggledObject.locked && toggledObject.object === state.selectedObject)
      ? null
      : state.selectedObject;

    set({
      objects: updatedObjects,
      selectedObject: newSelectedObject,
    });

    get().markUnsavedChanges();
  },

  updateObjectName: async (id, name) => {
    const state = get();
    const objectToUpdate = state.objects.find(obj => obj.id === id);
    if (!objectToUpdate) return;

    // Check if object is locked
    if (objectToUpdate.locked) return;

    // Check if object is in a locked group
    if (objectToUpdate.groupId) {
      const group = state.groups.find(g => g.id === objectToUpdate.groupId);
      if (group?.locked) return;
    }

    // Update in database immediately if we have Firestore ID and project context
    if (objectToUpdate.firestoreId && state.currentProjectId && state.currentUserId) {
      try {
        await updateObject(
          objectToUpdate.firestoreId, 
          { name }, 
          state.currentUserId, 
          state.currentProjectId
        );
        console.log(`Object name updated in database: "${name}"`);
      } catch (error) {
        console.error('Failed to update object name in database:', error);
      }
    }

    // Update local state
    set({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, name } : obj
      ),
    });

    get().markUnsavedChanges();
  },

  updateObjectProperties: async () => {
    const { selectedObject, objects, currentProjectId, currentUserId } = get();
    
    if (!selectedObject) return;

    const selectedObj = objects.find(obj => obj.object === selectedObject);
    if (!selectedObj || get().isObjectLocked(selectedObj.id)) return;

    // Update in database immediately if we have Firestore ID and project context
    if (selectedObj.firestoreId && currentProjectId && currentUserId) {
      try {
        const firestoreData = objectToFirestore(selectedObject, selectedObj.name, selectedObj.firestoreId, currentUserId, currentProjectId);
        firestoreData.visible = selectedObj.visible;
        firestoreData.locked = selectedObj.locked;
        if (selectedObj.groupId !== undefined) {
          firestoreData.groupId = selectedObj.groupId;
        }

        await updateObject(selectedObj.firestoreId, firestoreData, currentUserId, currentProjectId);
        console.log(`Object "${selectedObj.name}" properties updated in database`);
      } catch (error) {
        console.error('Failed to update object properties in database:', error);
      }
    }

    get().markUnsavedChanges();
    set((state) => ({ ...state }));
  },

  updateObjectColor: async (color) => {
    const { selectedObject, objects, currentProjectId, currentUserId } = get();
    
    if (selectedObject instanceof THREE.Mesh) {
      // Check if selected object is locked
      const selectedObj = objects.find(obj => obj.object === selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return;

      const material = selectedObject.material as THREE.MeshStandardMaterial;
      material.color.setStyle(color);
      material.needsUpdate = true;

      // Update in database immediately if we have Firestore ID and project context
      if (selectedObj?.firestoreId && currentProjectId && currentUserId) {
        try {
          await updateObject(
            selectedObj.firestoreId, 
            { color }, 
            currentUserId, 
            currentProjectId
          );
          console.log(`Object "${selectedObj.name}" color updated in database`);
        } catch (error) {
          console.error('Failed to update object color in database:', error);
        }
      }
      
      get().markUnsavedChanges();
    }
  },

  updateObjectOpacity: async (opacity) => {
    const { selectedObject, objects, currentProjectId, currentUserId } = get();
    
    if (selectedObject instanceof THREE.Mesh) {
      // Check if selected object is locked
      const selectedObj = objects.find(obj => obj.object === selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return;

      const material = selectedObject.material as THREE.MeshStandardMaterial;
      material.transparent = opacity < 1;
      material.opacity = opacity;
      material.needsUpdate = true;

      // Update in database immediately if we have Firestore ID and project context
      if (selectedObj?.firestoreId && currentProjectId && currentUserId) {
        try {
          await updateObject(
            selectedObj.firestoreId, 
            { opacity }, 
            currentUserId, 
            currentProjectId
          );
          console.log(`Object "${selectedObj.name}" opacity updated in database`);
        } catch (error) {
          console.error('Failed to update object opacity in database:', error);
        }
      }
      
      get().markUnsavedChanges();
    }
  },

  setSelectedElements: (type, indices) =>
    set((state) => ({
      selectedElements: {
        ...state.selectedElements,
        [type]: indices,
      },
    })),

  startVertexDrag: (index, position) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh)) return state;

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      const overlappingIndices = [];
      const selectedPos = new THREE.Vector3(
        positions.getX(index),
        positions.getY(index),
        positions.getZ(index)
      );

      for (let i = 0; i < positions.count; i++) {
        const pos = new THREE.Vector3(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        );
        if (pos.distanceTo(selectedPos) < 0.0001) {
          overlappingIndices.push(i);
        }
      }

      return {
        draggedVertex: {
          indices: overlappingIndices,
          position: position.clone(),
          initialPosition: position.clone()
        },
        selectedElements: {
          ...state.selectedElements,
          vertices: overlappingIndices
        }
      };
    }),

  updateVertexDrag: (position) =>
    set((state) => {
      if (!state.draggedVertex || !(state.selectedObject instanceof THREE.Mesh)) return state;

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      
      // Update all overlapping vertices to the new position
      state.draggedVertex.indices.forEach(index => {
        positions.setXYZ(
          index,
          position.x,
          position.y,
          position.z
        );
      });

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      
      return {
        draggedVertex: {
          ...state.draggedVertex,
          position: position.clone()
        }
      };
    }),

  endVertexDrag: () => {
    get().saveToHistory();
    get().updateObjectProperties(); // This will save to database
    set({ draggedVertex: null });
  },

  startEdgeDrag: (vertexIndices, positions, midpoint) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh)) return state;

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positionAttribute = geometry.attributes.position;
      const connectedVertices = new Set<number>();
      const edges: number[][] = [];

      // Find all overlapping vertices for each vertex in the edge
      const findOverlappingVertices = (targetIndex: number) => {
        const targetPos = new THREE.Vector3(
          positionAttribute.getX(targetIndex),
          positionAttribute.getY(targetIndex),
          positionAttribute.getZ(targetIndex)
        );

        const overlapping = [targetIndex];
        for (let i = 0; i < positionAttribute.count; i++) {
          if (i === targetIndex) continue;

          const pos = new THREE.Vector3(
            positionAttribute.getX(i),
            positionAttribute.getY(i),
            positionAttribute.getZ(i)
          );

          if (pos.distanceTo(targetPos) < 0.0001) {
            overlapping.push(i);
          }
        }
        return overlapping;
      };

      // Get all overlapping vertices for both edge vertices
      const vertex1Overlapping = findOverlappingVertices(vertexIndices[0]);
      const vertex2Overlapping = findOverlappingVertices(vertexIndices[1]);

      // Add all overlapping vertices to connected set
      vertex1Overlapping.forEach(v => connectedVertices.add(v));
      vertex2Overlapping.forEach(v => connectedVertices.add(v));

      // Create edge pairs
      vertex1Overlapping.forEach(v1 => {
        vertex2Overlapping.forEach(v2 => {
          edges.push([v1, v2]);
        });
      });

      return {
        draggedEdge: {
          indices: edges,
          positions: positions,
          initialPositions: positions.map(p => p.clone()),
          connectedVertices,
          midpoint: midpoint.clone()
        },
        selectedElements: {
          ...state.selectedElements,
          edges: Array.from(connectedVertices)
        }
      };
    }),

  updateEdgeDrag: (position) =>
    set((state) => {
      if (!state.draggedEdge || !(state.selectedObject instanceof THREE.Mesh)) return state;

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      const offset = position.clone().sub(state.draggedEdge.midpoint);

      // Move all connected vertices by the offset
      state.draggedEdge.connectedVertices.forEach(vertexIndex => {
        const currentPos = new THREE.Vector3(
          positions.getX(vertexIndex),
          positions.getY(vertexIndex),
          positions.getZ(vertexIndex)
        );
        const newPos = currentPos.add(offset);
        positions.setXYZ(vertexIndex, newPos.x, newPos.y, newPos.z);
      });

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      
      return {
        draggedEdge: {
          ...state.draggedEdge,
          midpoint: position.clone()
        }
      };
    }),

  endEdgeDrag: () => {
    get().saveToHistory();
    get().updateObjectProperties(); // This will save to database
    set({ draggedEdge: null });
  },

  setIsDraggingEdge: (isDragging) => set({ isDraggingEdge: isDragging }),

  updateCylinderVertices: (vertexCount) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh) || 
          !(state.selectedObject.geometry instanceof THREE.CylinderGeometry)) {
        return state;
      }

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const oldGeometry = state.selectedObject.geometry;
      const newGeometry = new THREE.CylinderGeometry(
        oldGeometry.parameters.radiusTop,
        oldGeometry.parameters.radiusBottom,
        oldGeometry.parameters.height,
        vertexCount,
        oldGeometry.parameters.heightSegments,
        oldGeometry.parameters.openEnded,
        oldGeometry.parameters.thetaStart,
        oldGeometry.parameters.thetaLength
      );

      state.selectedObject.geometry.dispose();
      state.selectedObject.geometry = newGeometry;

      get().saveToHistory();
      get().updateObjectProperties(); // This will save to database

      return {
        ...state,
        selectedElements: {
          vertices: [],
          edges: [],
          faces: []
        }
      };
    }),

  updateSphereVertices: (vertexCount) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh) || 
          !(state.selectedObject.geometry instanceof THREE.SphereGeometry)) {
        return state;
      }

      // Check if selected object is locked
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      if (get().isObjectLocked(selectedObj?.id || '')) return state;

      const oldGeometry = state.selectedObject.geometry;
      const newGeometry = new THREE.SphereGeometry(
        oldGeometry.parameters.radius,
        vertexCount,
        vertexCount / 2,
        oldGeometry.parameters.phiStart,
        oldGeometry.parameters.phiLength,
        oldGeometry.parameters.thetaStart,
        oldGeometry.parameters.thetaLength
      );

      state.selectedObject.geometry.dispose();
      state.selectedObject.geometry = newGeometry;

      get().saveToHistory();
      get().updateObjectProperties(); // This will save to database

      return {
        ...state,
        selectedElements: {
          vertices: [],
          edges: [],
          faces: []
        }
      };
    }),

  // Group management functions
  createGroup: async (name, objectIds = []) => {
    const { currentProjectId, currentUserId } = get();
    
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name,
      expanded: true,
      visible: true,
      locked: false,
      objectIds: [...objectIds]
    };

    // Add to local state immediately
    set((state) => {
      // Update objects to be part of this group
      const updatedObjects = state.objects.map(obj => 
        objectIds.includes(obj.id) 
          ? { ...obj, groupId: newGroup.id }
          : obj
      );

      return {
        groups: [...state.groups, newGroup],
        objects: updatedObjects
      };
    });

    // Save to database if we have project context
    if (currentProjectId && currentUserId) {
      try {
        const firestoreGroup: FirestoreGroup = {
          name: newGroup.name,
          expanded: newGroup.expanded,
          visible: newGroup.visible,
          locked: newGroup.locked,
          objectIds: newGroup.objectIds
        };

        const firestoreId = await saveGroup(firestoreGroup, currentUserId, currentProjectId);
        
        // Update local group with Firestore ID
        set((state) => ({
          groups: state.groups.map(group => 
            group.id === newGroup.id 
              ? { ...group, firestoreId }
              : group
          )
        }));
        
        console.log(`Group "${name}" saved to database with ID: ${firestoreId}`);
      } catch (error) {
        console.error('Failed to save group to database:', error);
      }
    }

    get().saveToHistory();
  },

  removeGroup: async (groupId) => {
    const state = get();
    const groupToRemove = state.groups.find(g => g.id === groupId);
    if (!groupToRemove || groupToRemove.locked) return;

    // Remove from database immediately if we have Firestore ID and project context
    if (groupToRemove.firestoreId && state.currentProjectId) {
      try {
        await deleteGroup(groupToRemove.firestoreId, state.currentProjectId);
        console.log(`Group "${groupToRemove.name}" deleted from database`);
      } catch (error) {
        console.error('Failed to delete group from database:', error);
      }
    }

    // Remove group reference from objects
    const updatedObjects = state.objects.map(obj => 
      obj.groupId === groupId 
        ? { ...obj, groupId: undefined }
        : obj
    );

    set({
      groups: state.groups.filter(group => group.id !== groupId),
      objects: updatedObjects
    });

    get().saveToHistory();
  },

  addObjectToGroup: async (objectId, groupId) => {
    const state = get();
    const objectToMove = state.objects.find(obj => obj.id === objectId);
    const targetGroup = state.groups.find(g => g.id === groupId);
    
    // Check if object is locked or target group is locked
    if (objectToMove?.locked || targetGroup?.locked) return;

    // Update local state
    const updatedObjects = state.objects.map(obj =>
      obj.id === objectId ? { ...obj, groupId } : obj
    );

    const updatedGroups = state.groups.map(group =>
      group.id === groupId 
        ? { ...group, objectIds: [...group.objectIds, objectId] }
        : group
    );

    set({
      objects: updatedObjects,
      groups: updatedGroups
    });

    // Update in database if we have project context
    if (objectToMove?.firestoreId && state.currentProjectId && state.currentUserId) {
      try {
        await updateObject(
          objectToMove.firestoreId, 
          { groupId }, 
          state.currentUserId, 
          state.currentProjectId
        );
        console.log(`Object "${objectToMove.name}" moved to group in database`);
      } catch (error) {
        console.error('Failed to update object group in database:', error);
      }
    }

    if (targetGroup?.firestoreId && state.currentProjectId && state.currentUserId) {
      try {
        await updateGroup(
          targetGroup.firestoreId, 
          { objectIds: [...targetGroup.objectIds, objectId] }, 
          state.currentUserId, 
          state.currentProjectId
        );
        console.log(`Group "${targetGroup.name}" updated in database`);
      } catch (error) {
        console.error('Failed to update group in database:', error);
      }
    }

    get().markUnsavedChanges();
  },

  removeObjectFromGroup: async (objectId) => {
    const state = get();
    const obj = state.objects.find(o => o.id === objectId);
    if (!obj?.groupId) return;

    const group = state.groups.find(g => g.id === obj.groupId);
    
    // Check if object is locked or group is locked
    if (obj.locked || group?.locked) return;

    // Update local state
    const updatedObjects = state.objects.map(o =>
      o.id === objectId ? { ...o, groupId: undefined } : o
    );

    const updatedGroups = state.groups.map(group =>
      group.id === obj.groupId
        ? { ...group, objectIds: group.objectIds.filter(id => id !== objectId) }
        : group
    );

    set({
      objects: updatedObjects,
      groups: updatedGroups
    });

    // Update in database if we have project context
    if (obj.firestoreId && state.currentProjectId && state.currentUserId) {
      try {
        await updateObject(
          obj.firestoreId, 
          { groupId: null }, 
          state.currentUserId, 
          state.currentProjectId
        );
        console.log(`Object "${obj.name}" removed from group in database`);
      } catch (error) {
        console.error('Failed to update object group in database:', error);
      }
    }

    if (group?.firestoreId && state.currentProjectId && state.currentUserId) {
      try {
        await updateGroup(
          group.firestoreId, 
          { objectIds: group.objectIds.filter(id => id !== objectId) }, 
          state.currentUserId, 
          state.currentProjectId
        );
        console.log(`Group "${group.name}" updated in database`);
      } catch (error) {
        console.error('Failed to update group in database:', error);
      }
    }

    get().markUnsavedChanges();
  },

  toggleGroupExpanded: (groupId) =>
    set((state) => ({
      groups: state.groups.map(group =>
        group.id === groupId ? { ...group, expanded: !group.expanded } : group
      )
    })),

  toggleGroupVisibility: async (groupId) => {
    const state = get();
    const group = state.groups.find(g => g.id === groupId);
    if (!group || group.locked) return;

    const newVisibility = !group.visible;

    // Update group visibility
    const updatedGroups = state.groups.map(g =>
      g.id === groupId ? { ...g, visible: newVisibility } : g
    );

    // Update all objects in the group
    const updatedObjects = state.objects.map(obj =>
      group.objectIds.includes(obj.id) 
        ? { ...obj, visible: newVisibility }
        : obj
    );

    // Clear selection if selected object becomes invisible
    const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
    const newSelectedObject = (selectedObj && group.objectIds.includes(selectedObj.id) && !newVisibility)
      ? null
      : state.selectedObject;

    set({
      groups: updatedGroups,
      objects: updatedObjects,
      selectedObject: newSelectedObject
    });

    // Update in database if we have project context
    if (group.firestoreId && state.currentProjectId && state.currentUserId) {
      try {
        await updateGroup(
          group.firestoreId, 
          { visible: newVisibility }, 
          state.currentUserId, 
          state.currentProjectId
        );
        console.log(`Group "${group.name}" visibility updated in database`);
      } catch (error) {
        console.error('Failed to update group visibility in database:', error);
      }
    }

    get().markUnsavedChanges();
  },

  toggleGroupLock: async (groupId) => {
    const state = get();
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;

    const newLockState = !group.locked;

    // Update group lock state
    const updatedGroups = state.groups.map(g =>
      g.id === groupId ? { ...g, locked: newLockState } : g
    );

    // Clear selection if selected object is in a group that becomes locked
    const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
    const newSelectedObject = (selectedObj && group.objectIds.includes(selectedObj.id) && newLockState)
      ? null
      : state.selectedObject;

    set({
      groups: updatedGroups,
      selectedObject: newSelectedObject
    });

    // Update in database if we have project context
    if (group.firestoreId && state.currentProjectId && state.currentUserId) {
      try {
        await updateGroup(
          group.firestoreId, 
          { locked: newLockState }, 
          state.currentUserId, 
          state.currentProjectId
        );
        console.log(`Group "${group.name}" lock state updated in database`);
      } catch (error) {
        console.error('Failed to update group lock state in database:', error);
      }
    }

    get().markUnsavedChanges();
  },

  updateGroupName: async (groupId, name) => {
    const state = get();
    const group = state.groups.find(g => g.id === groupId);
    if (group?.locked) return;

    // Update local state
    set({
      groups: state.groups.map(group =>
        group.id === groupId ? { ...group, name } : group
      )
    });

    // Update in database if we have project context
    if (group?.firestoreId && state.currentProjectId && state.currentUserId) {
      try {
        await updateGroup(
          group.firestoreId, 
          { name }, 
          state.currentUserId, 
          state.currentProjectId
        );
        console.log(`Group name updated in database: "${name}"`);
      } catch (error) {
        console.error('Failed to update group name in database:', error);
      }
    }

    get().markUnsavedChanges();
  },

  moveObjectsToGroup: async (objectIds, groupId) => {
    const state = get();
    
    // Check if any objects are locked
    const lockedObjects = objectIds.filter(id => {
      const obj = state.objects.find(o => o.id === id);
      return obj?.locked || (obj?.groupId && state.groups.find(g => g.id === obj.groupId)?.locked);
    });

    if (lockedObjects.length > 0) return;

    // Check if target group is locked
    if (groupId) {
      const targetGroup = state.groups.find(g => g.id === groupId);
      if (targetGroup?.locked) return;
    }

    // Remove objects from their current groups
    const updatedGroups = state.groups.map(group => ({
      ...group,
      objectIds: group.objectIds.filter(id => !objectIds.includes(id))
    }));

    // Add objects to the new group if specified
    const finalGroups = groupId 
      ? updatedGroups.map(group =>
          group.id === groupId
            ? { ...group, objectIds: [...group.objectIds, ...objectIds] }
            : group
        )
      : updatedGroups;

    // Update objects
    const updatedObjects = state.objects.map(obj =>
      objectIds.includes(obj.id) 
        ? { ...obj, groupId }
        : obj
    );

    set({
      groups: finalGroups,
      objects: updatedObjects
    });

    // Update objects in database
    if (state.currentProjectId && state.currentUserId) {
      const updatePromises = objectIds.map(async (objectId) => {
        const obj = state.objects.find(o => o.id === objectId);
        if (obj?.firestoreId) {
          try {
            await updateObject(
              obj.firestoreId, 
              { groupId }, 
              state.currentUserId, 
              state.currentProjectId
            );
          } catch (error) {
            console.error(`Failed to update object ${obj.name} group in database:`, error);
          }
        }
      });

      await Promise.all(updatePromises);
      console.log(`Moved ${objectIds.length} objects to ${groupId ? 'group' : 'no group'} in database`);
    }

    get().markUnsavedChanges();
  },

  // New action functions
  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;

      const previousState = state.history[state.historyIndex - 1];
      
      return {
        ...state,
        objects: previousState.objects,
        groups: previousState.groups,
        lights: previousState.lights.map(light => ({
          ...light,
          object: createLight(light.type, light.position, light.target)
        })),
        historyIndex: state.historyIndex - 1,
        canUndo: state.historyIndex - 1 > 0,
        canRedo: true,
        selectedObject: null, // Clear selection on undo
        selectedLight: null
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;

      const nextState = state.history[state.historyIndex + 1];
      
      return {
        ...state,
        objects: nextState.objects,
        groups: nextState.groups,
        lights: nextState.lights.map(light => ({
          ...light,
          object: createLight(light.type, light.position, light.target)
        })),
        historyIndex: state.historyIndex + 1,
        canUndo: true,
        canRedo: state.historyIndex + 1 < state.history.length - 1,
        selectedObject: null, // Clear selection on redo
        selectedLight: null
      };
    }),

  duplicateObject: async () => {
    const state = get();
    if (!state.selectedObject) return;

    // Check if selected object is locked
    const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
    if (!selectedObj || get().isObjectLocked(selectedObj.id)) return;

    const clonedObject = cloneObject(state.selectedObject);
    clonedObject.position.x += 1; // Offset the duplicate

    const newObject = {
      id: crypto.randomUUID(),
      object: clonedObject,
      name: `${selectedObj.name} Copy`,
      visible: true,
      locked: false,
      groupId: selectedObj.groupId
    };

    // Add to local state
    set((state) => {
      // Update group if object belongs to one
      let updatedGroups = state.groups;
      if (selectedObj.groupId) {
        updatedGroups = state.groups.map(group =>
          group.id === selectedObj.groupId
            ? { ...group, objectIds: [...group.objectIds, newObject.id] }
            : group
        );
      }

      return {
        objects: [...state.objects, newObject],
        groups: updatedGroups,
        selectedObject: clonedObject
      };
    });

    // Save to database if we have project context
    if (state.currentProjectId && state.currentUserId) {
      try {
        const firestoreData = objectToFirestore(clonedObject, newObject.name, undefined, state.currentUserId, state.currentProjectId);
        firestoreData.visible = true;
        firestoreData.locked = false;
        if (newObject.groupId) {
          firestoreData.groupId = newObject.groupId;
        }
        
        const firestoreId = await saveObject(firestoreData, state.currentUserId, state.currentProjectId);
        
        // Update local object with Firestore ID
        set((state) => ({
          objects: state.objects.map(obj => 
            obj.id === newObject.id 
              ? { ...obj, firestoreId }
              : obj
          )
        }));
        
        console.log(`Duplicated object "${newObject.name}" saved to database with ID: ${firestoreId}`);
      } catch (error) {
        console.error('Failed to save duplicated object to database:', error);
      }
    }

    get().saveToHistory();
  },

  mirrorObject: async () => {
    const state = get();
    if (!state.selectedObject) return;

    // Check if selected object is locked
    const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
    if (!selectedObj || get().isObjectLocked(selectedObj.id)) return;

    // Mirror along X-axis
    state.selectedObject.scale.x *= -1;

    // Update in database
    await get().updateObjectProperties();

    get().saveToHistory();
  },

  zoomIn: () =>
    set((state) => {
      get().markUnsavedChanges();
      return {
        cameraZoom: Math.min(state.cameraZoom * 1.2, 5)
      };
    }),

  zoomOut: () =>
    set((state) => {
      get().markUnsavedChanges();
      return {
        cameraZoom: Math.max(state.cameraZoom / 1.2, 0.1)
      };
    }),

  // Enhanced placement functions
  startObjectPlacement: (objectDef) =>
    set({
      placementMode: true,
      pendingObject: objectDef,
      selectedObject: null,
      transformMode: null,
      editMode: null
    }),

  placeObjectAt: async (position, rotation = null) => {
    const state = get();
    if (!state.pendingObject) return;

    const geometryOrGroup = state.pendingObject.geometry();
    let object: THREE.Object3D;

    // Check if it's a THREE.Group or THREE.BufferGeometry
    if (geometryOrGroup instanceof THREE.Group) {
      // It's already a complete group, use it directly
      object = geometryOrGroup;
    } else {
      // It's a BufferGeometry, create a mesh with material
      const material = new THREE.MeshStandardMaterial({ 
        color: state.pendingObject.color || '#44aa88' 
      });
      object = new THREE.Mesh(geometryOrGroup, material);
    }

    // Set position and rotation
    object.position.copy(position);
    if (rotation) {
      object.rotation.copy(rotation);
    }

    // Add to scene using the regular addObject method which handles database saving
    await get().addObject(object, state.pendingObject.name);

    set({
      placementMode: false,
      pendingObject: null,
      selectedObject: object
    });
  },

  cancelObjectPlacement: () =>
    set({
      placementMode: false,
      pendingObject: null
    }),

  // Light management functions
  addLight: async (type, position = [2, 2, 2]) => {
    const { lights, currentProjectId, currentUserId } = get();
    
    const lightCount = lights.filter(l => l.type === type).length;
    const newLight: Light = {
      id: crypto.randomUUID(),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Light ${lightCount + 1}`,
      type,
      position: [...position],
      target: [0, 0, 0],
      intensity: 1,
      color: '#ffffff',
      visible: true,
      castShadow: true,
      distance: type === 'directional' ? 0 : 10,
      decay: 2,
      angle: Math.PI / 3,
      penumbra: 0,
      object: createLight(type, position, [0, 0, 0])
    };

    // Add to local state
    set((state) => ({
      lights: [...state.lights, newLight],
      selectedLight: newLight
    }));

    // Save to database if we have project context
    if (currentProjectId && currentUserId) {
      try {
        const firestoreLight: FirestoreLight = {
          name: newLight.name,
          type: newLight.type,
          position: newLight.position,
          target: newLight.target,
          intensity: newLight.intensity,
          color: newLight.color,
          visible: newLight.visible,
          castShadow: newLight.castShadow,
          distance: newLight.distance,
          decay: newLight.decay,
          angle: newLight.angle,
          penumbra: newLight.penumbra
        };

        const firestoreId = await saveLight(firestoreLight, currentUserId, currentProjectId);
        
        // Update local light with Firestore ID
        set((state) => ({
          lights: state.lights.map(light => 
            light.id === newLight.id 
              ? { ...light, firestoreId }
              : light
          )
        }));
        
        console.log(`Light "${newLight.name}" saved to database with ID: ${firestoreId}`);
      } catch (error) {
        console.error('Failed to save light to database:', error);
      }
    }

    get().saveToHistory();
  },

  removeLight: async (lightId) => {
    const state = get();
    const lightToRemove = state.lights.find(light => light.id === lightId);
    
    if (!lightToRemove) return;

    // Remove from database immediately if we have Firestore ID and project context
    if (lightToRemove.firestoreId && state.currentProjectId) {
      try {
        await deleteLight(lightToRemove.firestoreId, state.currentProjectId);
        console.log(`Light "${lightToRemove.name}" deleted from database`);
      } catch (error) {
        console.error('Failed to delete light from database:', error);
      }
    }

    // Remove from local state
    const updatedLights = state.lights.filter(light => light.id !== lightId);
    
    set({
      lights: updatedLights,
      selectedLight: state.selectedLight?.id === lightId ? null : state.selectedLight
    });

    get().saveToHistory();
  },

  updateLight: async (lightId, properties) => {
    const { lights, currentProjectId, currentUserId } = get();
    
    const updatedLights = lights.map(light => {
      if (light.id === lightId) {
        const updatedLight = { ...light, ...properties };
        
        // Update the THREE.js light object
        if (updatedLight.object) {
          const threeLight = updatedLight.object;
          
          // Update common properties
          threeLight.intensity = updatedLight.intensity;
          threeLight.color.setStyle(updatedLight.color);
          threeLight.visible = updatedLight.visible;
          threeLight.castShadow = updatedLight.castShadow;
          threeLight.position.set(...updatedLight.position);
          
          // Update type-specific properties
          if (updatedLight.type === 'directional' && threeLight instanceof THREE.DirectionalLight) {
            threeLight.target.position.set(...updatedLight.target);
          } else if (updatedLight.type === 'point' && threeLight instanceof THREE.PointLight) {
            threeLight.distance = updatedLight.distance;
            threeLight.decay = updatedLight.decay;
          } else if (updatedLight.type === 'spot' && threeLight instanceof THREE.SpotLight) {
            threeLight.target.position.set(...updatedLight.target);
            threeLight.distance = updatedLight.distance;
            threeLight.decay = updatedLight.decay;
            threeLight.angle = updatedLight.angle;
            threeLight.penumbra = updatedLight.penumbra;
          }
        }
        
        return updatedLight;
      }
      return light;
    });

    set({
      lights: updatedLights,
      selectedLight: get().selectedLight?.id === lightId 
        ? updatedLights.find(l => l.id === lightId) || null
        : get().selectedLight
    });

    // Update in database if we have project context
    const lightToUpdate = lights.find(l => l.id === lightId);
    if (lightToUpdate?.firestoreId && currentProjectId && currentUserId) {
      try {
        const firestoreLight: Partial<FirestoreLight> = {
          ...properties
        };

        await updateLight(lightToUpdate.firestoreId, firestoreLight, currentUserId, currentProjectId);
        console.log(`Light "${lightToUpdate.name}" updated in database`);
      } catch (error) {
        console.error('Failed to update light in database:', error);
      }
    }

    get().markUnsavedChanges();
  },

  toggleLightVisibility: async (lightId) => {
    const { lights, currentProjectId, currentUserId } = get();
    
    const lightToToggle = lights.find(l => l.id === lightId);
    if (!lightToToggle) return;

    const newVisibility = !lightToToggle.visible;

    const updatedLights = lights.map(light =>
      light.id === lightId ? { ...light, visible: newVisibility } : light
    );

    // Update the THREE.js object
    const light = updatedLights.find(l => l.id === lightId);
    if (light?.object) {
      light.object.visible = light.visible;
    }

    set({ lights: updatedLights });

    // Update in database if we have project context
    if (lightToToggle.firestoreId && currentProjectId && currentUserId) {
      try {
        await updateLight(
          lightToToggle.firestoreId, 
          { visible: newVisibility }, 
          currentUserId, 
          currentProjectId
        );
        console.log(`Light "${lightToToggle.name}" visibility updated in database`);
      } catch (error) {
        console.error('Failed to update light visibility in database:', error);
      }
    }

    get().markUnsavedChanges();
  },

  setSelectedLight: (light) => set({ selectedLight: light }),

  // Helper functions
  isObjectLocked: (objectId) => {
    const state = get();
    const obj = state.objects.find(o => o.id === objectId);
    if (!obj) return false;

    // Check if object itself is locked
    if (obj.locked) return true;

    // Check if object is in a locked group
    if (obj.groupId) {
      const group = state.groups.find(g => g.id === obj.groupId);
      return group?.locked || false;
    }

    return false;
  },

  canSelectObject: (object) => {
    const state = get();
    const obj = state.objects.find(o => o.object === object);
    return obj ? !get().isObjectLocked(obj.id) : true;
  },

  // Save functions
  markSaved: () => 
    set({
      lastSaved: new Date(),
      hasUnsavedChanges: false
    }),

  markUnsavedChanges: () =>
    set({
      hasUnsavedChanges: true
    }),
}));