import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import * as THREE from 'three';

// Types for Firestore data
export interface FirestoreObject {
  id?: string;
  userId?: string;
  projectId?: string; // Add project scoping
  name: string;
  type: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  color: string;
  opacity: number;
  visible: boolean;
  locked: boolean;
  groupId?: string;
  geometryParams?: any;
  materialParams?: any;
  // Add support for custom geometry data
  customGeometry?: {
    type: string;
    vertices?: number[];
    indices?: number[];
    normals?: number[];
    uvs?: number[];
    // Add parameters for standard geometries that might be custom
    parameters?: any;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreGroup {
  id?: string;
  userId?: string;
  projectId?: string; // Add project scoping
  name: string;
  expanded: boolean;
  visible: boolean;
  locked: boolean;
  objectIds: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreLight {
  id?: string;
  userId?: string;
  projectId?: string; // Add project scoping
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreScene {
  id?: string;
  userId?: string;
  projectId?: string; // Add project scoping
  name: string;
  description?: string;
  backgroundColor: string;
  showGrid: boolean;
  gridSize: number;
  gridDivisions: number;
  cameraPerspective: string;
  cameraZoom: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Project-scoped collection names - each project gets its own subcollections
const getProjectCollections = (projectId: string) => ({
  OBJECTS: `projects/${projectId}/objects`,
  GROUPS: `projects/${projectId}/groups`,
  LIGHTS: `projects/${projectId}/lights`,
  SCENES: `projects/${projectId}/scenes`
});

// Helper function to serialize custom geometry
const serializeGeometry = (geometry: THREE.BufferGeometry) => {
  const positionAttribute = geometry.attributes.position;
  const normalAttribute = geometry.attributes.normal;
  const uvAttribute = geometry.attributes.uv;
  const indexAttribute = geometry.index;

  return {
    vertices: positionAttribute ? Array.from(positionAttribute.array) : [],
    normals: normalAttribute ? Array.from(normalAttribute.array) : [],
    uvs: uvAttribute ? Array.from(uvAttribute.array) : [],
    indices: indexAttribute ? Array.from(indexAttribute.array) : [],
    parameters: geometry.parameters || {} // Preserve original parameters if available
  };
};

// Helper function to deserialize custom geometry
const deserializeGeometry = (customGeometry: any): THREE.BufferGeometry => {
  const geometry = new THREE.BufferGeometry();
  
  if (customGeometry.vertices && customGeometry.vertices.length > 0) {
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(customGeometry.vertices, 3));
  }
  
  if (customGeometry.normals && customGeometry.normals.length > 0) {
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(customGeometry.normals, 3));
  }
  
  if (customGeometry.uvs && customGeometry.uvs.length > 0) {
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(customGeometry.uvs, 2));
  }
  
  if (customGeometry.indices && customGeometry.indices.length > 0) {
    geometry.setIndex(customGeometry.indices);
  }
  
  // Preserve parameters for potential reconstruction
  if (customGeometry.parameters) {
    (geometry as any).parameters = customGeometry.parameters;
  }
  
  // Compute normals if they weren't provided
  if (!customGeometry.normals || customGeometry.normals.length === 0) {
    geometry.computeVertexNormals();
  }
  
  return geometry;
};

// Helper function to determine if a geometry should be treated as custom
const isCustomGeometry = (geometry: THREE.BufferGeometry, name: string): boolean => {
  // Check by name patterns
  const customNames = ['star', 'heart', 'torus', 'custom'];
  const nameIsCustom = customNames.some(customName => 
    name.toLowerCase().includes(customName)
  );
  
  // Check by geometry type
  const isTorusGeometry = geometry instanceof THREE.TorusGeometry;
  
  // Check if it's a standard geometry with parameters
  const hasStandardParams = geometry.parameters && (
    geometry instanceof THREE.BoxGeometry ||
    geometry instanceof THREE.SphereGeometry ||
    geometry instanceof THREE.CylinderGeometry ||
    geometry instanceof THREE.ConeGeometry
  );
  
  // If it's a torus or has custom name patterns, or doesn't have standard parameters, treat as custom
  return nameIsCustom || isTorusGeometry || !hasStandardParams;
};

// Helper function to convert THREE.js object to Firestore format
export const objectToFirestore = (object: THREE.Object3D, name: string, id?: string, userId?: string, projectId?: string): FirestoreObject => {
  const firestoreObj: FirestoreObject = {
    name,
    type: object.type,
    position: {
      x: object.position.x,
      y: object.position.y,
      z: object.position.z
    },
    rotation: {
      x: object.rotation.x,
      y: object.rotation.y,
      z: object.rotation.z
    },
    scale: {
      x: object.scale.x,
      y: object.scale.y,
      z: object.scale.z
    },
    color: '#44aa88', // Default color
    opacity: 1,
    visible: object.visible,
    locked: false,
    updatedAt: serverTimestamp()
  };

  // Add scoping fields
  if (userId) firestoreObj.userId = userId;
  if (projectId) firestoreObj.projectId = projectId;

  if (id) {
    firestoreObj.id = id;
  } else {
    firestoreObj.createdAt = serverTimestamp();
  }

  // Extract material properties if it's a mesh
  if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial) {
    firestoreObj.color = '#' + object.material.color.getHexString();
    firestoreObj.opacity = object.material.opacity;
    
    firestoreObj.materialParams = {
      transparent: object.material.transparent,
      metalness: object.material.metalness,
      roughness: object.material.roughness
    };
  }

  // Extract geometry parameters with default values to prevent undefined
  if (object instanceof THREE.Mesh) {
    const geometry = object.geometry;
    
    // Check if this should be treated as a custom geometry
    if (isCustomGeometry(geometry, name)) {
      // Serialize the entire geometry for custom shapes
      firestoreObj.customGeometry = {
        type: 'custom',
        ...serializeGeometry(geometry)
      };
      
      // Mark this as a custom geometry type
      firestoreObj.type = 'CustomMesh';
      
      // For torus geometry, also save the specific type and parameters
      if (geometry instanceof THREE.TorusGeometry) {
        firestoreObj.customGeometry.type = 'torus';
        firestoreObj.customGeometry.parameters = {
          radius: geometry.parameters.radius,
          tube: geometry.parameters.tube,
          radialSegments: geometry.parameters.radialSegments,
          tubularSegments: geometry.parameters.tubularSegments,
          arc: geometry.parameters.arc
        };
      }
    } else {
      // Handle standard geometries with parameters
      if (geometry instanceof THREE.BoxGeometry) {
        firestoreObj.geometryParams = {
          width: geometry.parameters.width ?? 1,
          height: geometry.parameters.height ?? 1,
          depth: geometry.parameters.depth ?? 1
        };
      } else if (geometry instanceof THREE.SphereGeometry) {
        firestoreObj.geometryParams = {
          radius: geometry.parameters.radius ?? 0.5,
          widthSegments: geometry.parameters.widthSegments ?? 32,
          heightSegments: geometry.parameters.heightSegments ?? 16
        };
      } else if (geometry instanceof THREE.CylinderGeometry) {
        firestoreObj.geometryParams = {
          radiusTop: geometry.parameters.radiusTop ?? 0.5,
          radiusBottom: geometry.parameters.radiusBottom ?? 0.5,
          height: geometry.parameters.height ?? 1,
          radialSegments: geometry.parameters.radialSegments ?? 32
        };
      } else if (geometry instanceof THREE.ConeGeometry) {
        firestoreObj.geometryParams = {
          radius: geometry.parameters.radius ?? 0.5,
          height: geometry.parameters.height ?? 1,
          radialSegments: geometry.parameters.radialSegments ?? 32
        };
      } else {
        // Fallback: serialize as custom geometry
        firestoreObj.customGeometry = {
          type: 'custom',
          ...serializeGeometry(geometry)
        };
        firestoreObj.type = 'CustomMesh';
      }
    }
  }

  return firestoreObj;
};

// Helper function to convert Firestore data back to THREE.js object
export const firestoreToObject = (data: FirestoreObject): THREE.Object3D | null => {
  let object: THREE.Object3D | null = null;

  // Create geometry based on type and parameters
  if (data.type === 'Mesh' || data.type === 'CustomMesh') {
    let geometry: THREE.BufferGeometry;
    
    // Handle custom geometries first
    if (data.customGeometry) {
      if (data.customGeometry.type === 'torus' && data.customGeometry.parameters) {
        // Reconstruct torus geometry from parameters
        const params = data.customGeometry.parameters;
        geometry = new THREE.TorusGeometry(
          params.radius || 1,
          params.tube || 0.4,
          params.radialSegments || 8,
          params.tubularSegments || 16,
          params.arc || Math.PI * 2
        );
      } else {
        // Deserialize custom geometry from vertex data
        geometry = deserializeGeometry(data.customGeometry);
      }
    } else if (data.geometryParams) {
      // Handle standard geometries
      if (data.geometryParams.width !== undefined) {
        // Box geometry
        geometry = new THREE.BoxGeometry(
          data.geometryParams.width,
          data.geometryParams.height,
          data.geometryParams.depth
        );
      } else if (data.geometryParams.radius !== undefined && data.geometryParams.widthSegments !== undefined) {
        // Sphere geometry
        geometry = new THREE.SphereGeometry(
          data.geometryParams.radius,
          data.geometryParams.widthSegments,
          data.geometryParams.heightSegments
        );
      } else if (data.geometryParams.radiusTop !== undefined) {
        // Cylinder geometry
        geometry = new THREE.CylinderGeometry(
          data.geometryParams.radiusTop,
          data.geometryParams.radiusBottom,
          data.geometryParams.height,
          data.geometryParams.radialSegments
        );
      } else if (data.geometryParams.radius !== undefined && data.geometryParams.radialSegments !== undefined) {
        // Cone geometry
        geometry = new THREE.ConeGeometry(
          data.geometryParams.radius,
          data.geometryParams.height,
          data.geometryParams.radialSegments
        );
      } else {
        // Default to box
        geometry = new THREE.BoxGeometry(1, 1, 1);
      }
    } else {
      // Default to box if no geometry data
      geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: data.color,
      transparent: data.opacity < 1,
      opacity: data.opacity,
      ...data.materialParams
    });

    object = new THREE.Mesh(geometry, material);
  }

  if (object) {
    // Set transform properties
    object.position.set(data.position.x, data.position.y, data.position.z);
    object.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
    object.scale.set(data.scale.x, data.scale.y, data.scale.z);
    object.visible = data.visible;
  }

  return object;
};

// Project-scoped Object CRUD operations
export const saveObject = async (objectData: FirestoreObject, userId: string, projectId: string): Promise<string> => {
  try {
    const collections = getProjectCollections(projectId);
    const dataWithScoping = { ...objectData, userId, projectId };
    const docRef = await addDoc(collection(db, collections.OBJECTS), dataWithScoping);
    return docRef.id;
  } catch (error) {
    console.error('Error saving object:', error);
    throw error;
  }
};

export const updateObject = async (id: string, objectData: Partial<FirestoreObject>, userId: string, projectId: string): Promise<void> => {
  try {
    const collections = getProjectCollections(projectId);
    const objectRef = doc(db, collections.OBJECTS, id);
    await updateDoc(objectRef, {
      ...objectData,
      userId,
      projectId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating object:', error);
    throw error;
  }
};

export const deleteObject = async (id: string, projectId: string): Promise<void> => {
  try {
    const collections = getProjectCollections(projectId);
    await deleteDoc(doc(db, collections.OBJECTS, id));
  } catch (error) {
    console.error('Error deleting object:', error);
    throw error;
  }
};

export const getObjects = async (userId: string, projectId: string): Promise<FirestoreObject[]> => {
  try {
    const collections = getProjectCollections(projectId);
    // Simplified query - filter by userId and projectId only, sort client-side
    const q = query(
      collection(db, collections.OBJECTS), 
      where('userId', '==', userId),
      where('projectId', '==', projectId)
    );
    const querySnapshot = await getDocs(q);
    const objects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreObject));
    
    // Sort by createdAt client-side to avoid index requirement
    return objects.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
  } catch (error) {
    console.error('Error getting objects:', error);
    throw error;
  }
};

// Project-scoped Group CRUD operations
export const saveGroup = async (groupData: FirestoreGroup, userId: string, projectId: string): Promise<string> => {
  try {
    const collections = getProjectCollections(projectId);
    const dataWithScoping = { ...groupData, userId, projectId };
    const docRef = await addDoc(collection(db, collections.GROUPS), dataWithScoping);
    return docRef.id;
  } catch (error) {
    console.error('Error saving group:', error);
    throw error;
  }
};

export const updateGroup = async (id: string, groupData: Partial<FirestoreGroup>, userId: string, projectId: string): Promise<void> => {
  try {
    const collections = getProjectCollections(projectId);
    const groupRef = doc(db, collections.GROUPS, id);
    await updateDoc(groupRef, {
      ...groupData,
      userId,
      projectId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating group:', error);
    throw error;
  }
};

export const deleteGroup = async (id: string, projectId: string): Promise<void> => {
  try {
    const collections = getProjectCollections(projectId);
    await deleteDoc(doc(db, collections.GROUPS, id));
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

export const getGroups = async (userId: string, projectId: string): Promise<FirestoreGroup[]> => {
  try {
    const collections = getProjectCollections(projectId);
    // Simplified query - filter by userId and projectId only, sort client-side
    const q = query(
      collection(db, collections.GROUPS), 
      where('userId', '==', userId),
      where('projectId', '==', projectId)
    );
    const querySnapshot = await getDocs(q);
    const groups = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreGroup));
    
    // Sort by createdAt client-side to avoid index requirement
    return groups.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
  } catch (error) {
    console.error('Error getting groups:', error);
    throw error;
  }
};

// Project-scoped Light CRUD operations
export const saveLight = async (lightData: FirestoreLight, userId: string, projectId: string): Promise<string> => {
  try {
    const collections = getProjectCollections(projectId);
    const dataWithScoping = { ...lightData, userId, projectId };
    const docRef = await addDoc(collection(db, collections.LIGHTS), dataWithScoping);
    return docRef.id;
  } catch (error) {
    console.error('Error saving light:', error);
    throw error;
  }
};

export const updateLight = async (id: string, lightData: Partial<FirestoreLight>, userId: string, projectId: string): Promise<void> => {
  try {
    const collections = getProjectCollections(projectId);
    const lightRef = doc(db, collections.LIGHTS, id);
    await updateDoc(lightRef, {
      ...lightData,
      userId,
      projectId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating light:', error);
    throw error;
  }
};

export const deleteLight = async (id: string, projectId: string): Promise<void> => {
  try {
    const collections = getProjectCollections(projectId);
    await deleteDoc(doc(db, collections.LIGHTS, id));
  } catch (error) {
    console.error('Error deleting light:', error);
    throw error;
  }
};

export const getLights = async (userId: string, projectId: string): Promise<FirestoreLight[]> => {
  try {
    const collections = getProjectCollections(projectId);
    // Simplified query - filter by userId and projectId only, sort client-side
    const q = query(
      collection(db, collections.LIGHTS), 
      where('userId', '==', userId),
      where('projectId', '==', projectId)
    );
    const querySnapshot = await getDocs(q);
    const lights = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreLight));
    
    // Sort by createdAt client-side to avoid index requirement
    return lights.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
  } catch (error) {
    console.error('Error getting lights:', error);
    throw error;
  }
};

// Project-scoped Scene CRUD operations
export const saveScene = async (sceneData: FirestoreScene, userId: string, projectId: string): Promise<string> => {
  try {
    const collections = getProjectCollections(projectId);
    const dataWithScoping = { ...sceneData, userId, projectId };
    const docRef = await addDoc(collection(db, collections.SCENES), dataWithScoping);
    return docRef.id;
  } catch (error) {
    console.error('Error saving scene:', error);
    throw error;
  }
};

export const updateScene = async (id: string, sceneData: Partial<FirestoreScene>, userId: string, projectId: string): Promise<void> => {
  try {
    const collections = getProjectCollections(projectId);
    const sceneRef = doc(db, collections.SCENES, id);
    await updateDoc(sceneRef, {
      ...sceneData,
      userId,
      projectId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating scene:', error);
    throw error;
  }
};

export const getScenes = async (userId: string, projectId: string): Promise<FirestoreScene[]> => {
  try {
    const collections = getProjectCollections(projectId);
    // Simplified query - filter by userId and projectId only, sort client-side
    const q = query(
      collection(db, collections.SCENES), 
      where('userId', '==', userId),
      where('projectId', '==', projectId)
    );
    const querySnapshot = await getDocs(q);
    const scenes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreScene));
    
    // Sort by createdAt client-side to avoid index requirement
    return scenes.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
  } catch (error) {
    console.error('Error getting scenes:', error);
    throw error;
  }
};

// Project-scoped Real-time listeners
export const subscribeToObjects = (userId: string, projectId: string, callback: (objects: FirestoreObject[]) => void) => {
  const collections = getProjectCollections(projectId);
  // Simplified query - filter by userId and projectId only
  const q = query(
    collection(db, collections.OBJECTS), 
    where('userId', '==', userId),
    where('projectId', '==', projectId)
  );
  return onSnapshot(q, (querySnapshot) => {
    const objects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreObject));
    
    // Sort by createdAt client-side
    const sortedObjects = objects.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
    
    callback(sortedObjects);
  });
};

export const subscribeToGroups = (userId: string, projectId: string, callback: (groups: FirestoreGroup[]) => void) => {
  const collections = getProjectCollections(projectId);
  // Simplified query - filter by userId and projectId only
  const q = query(
    collection(db, collections.GROUPS), 
    where('userId', '==', userId),
    where('projectId', '==', projectId)
  );
  return onSnapshot(q, (querySnapshot) => {
    const groups = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreGroup));
    
    // Sort by createdAt client-side
    const sortedGroups = groups.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
    
    callback(sortedGroups);
  });
};

export const subscribeToLights = (userId: string, projectId: string, callback: (lights: FirestoreLight[]) => void) => {
  const collections = getProjectCollections(projectId);
  // Simplified query - filter by userId and projectId only
  const q = query(
    collection(db, collections.LIGHTS), 
    where('userId', '==', userId),
    where('projectId', '==', projectId)
  );
  return onSnapshot(q, (querySnapshot) => {
    const lights = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreLight));
    
    // Sort by createdAt client-side
    const sortedLights = lights.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
    
    callback(sortedLights);
  });
};

// Utility functions for project data management
export const clearProjectData = async (userId: string, projectId: string): Promise<void> => {
  try {
    const collections = getProjectCollections(projectId);
    
    // Clear all objects
    const objectsQuery = query(
      collection(db, collections.OBJECTS),
      where('userId', '==', userId),
      where('projectId', '==', projectId)
    );
    const objectsSnapshot = await getDocs(objectsQuery);
    const objectDeletePromises = objectsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Clear all groups
    const groupsQuery = query(
      collection(db, collections.GROUPS),
      where('userId', '==', userId),
      where('projectId', '==', projectId)
    );
    const groupsSnapshot = await getDocs(groupsQuery);
    const groupDeletePromises = groupsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Clear all lights
    const lightsQuery = query(
      collection(db, collections.LIGHTS),
      where('userId', '==', userId),
      where('projectId', '==', projectId)
    );
    const lightsSnapshot = await getDocs(lightsQuery);
    const lightDeletePromises = lightsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Clear all scenes
    const scenesQuery = query(
      collection(db, collections.SCENES),
      where('userId', '==', userId),
      where('projectId', '==', projectId)
    );
    const scenesSnapshot = await getDocs(scenesQuery);
    const sceneDeletePromises = scenesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Execute all deletions
    await Promise.all([
      ...objectDeletePromises,
      ...groupDeletePromises,
      ...lightDeletePromises,
      ...sceneDeletePromises
    ]);
    
    console.log(`Cleared all data for project ${projectId}`);
  } catch (error) {
    console.error('Error clearing project data:', error);
    throw error;
  }
};

export const copyProjectData = async (
  sourceProjectId: string, 
  targetProjectId: string, 
  userId: string
): Promise<void> => {
  try {
    // Get all data from source project
    const [objects, groups, lights, scenes] = await Promise.all([
      getObjects(userId, sourceProjectId),
      getGroups(userId, sourceProjectId),
      getLights(userId, sourceProjectId),
      getScenes(userId, sourceProjectId)
    ]);
    
    // Copy objects
    const objectPromises = objects.map(obj => {
      const { id, createdAt, updatedAt, ...objData } = obj;
      return saveObject(objData, userId, targetProjectId);
    });
    
    // Copy groups
    const groupPromises = groups.map(group => {
      const { id, createdAt, updatedAt, ...groupData } = group;
      return saveGroup(groupData, userId, targetProjectId);
    });
    
    // Copy lights
    const lightPromises = lights.map(light => {
      const { id, createdAt, updatedAt, ...lightData } = light;
      return saveLight(lightData, userId, targetProjectId);
    });
    
    // Copy scenes
    const scenePromises = scenes.map(scene => {
      const { id, createdAt, updatedAt, ...sceneData } = scene;
      return saveScene(sceneData, userId, targetProjectId);
    });
    
    await Promise.all([
      ...objectPromises,
      ...groupPromises,
      ...lightPromises,
      ...scenePromises
    ]);
    
    console.log(`Copied data from project ${sourceProjectId} to ${targetProjectId}`);
  } catch (error) {
    console.error('Error copying project data:', error);
    throw error;
  }
};

// Batch operations for better performance
export const saveObjectsBatch = async (objects: FirestoreObject[], userId: string, projectId: string): Promise<void> => {
  try {
    const batch = [];
    for (const obj of objects) {
      batch.push(saveObject(obj, userId, projectId));
    }
    await Promise.all(batch);
  } catch (error) {
    console.error('Error saving objects batch:', error);
    throw error;
  }
};

export const deleteObjectsBatch = async (ids: string[], projectId: string): Promise<void> => {
  try {
    const batch = [];
    for (const id of ids) {
      batch.push(deleteObject(id, projectId));
    }
    await Promise.all(batch);
  } catch (error) {
    console.error('Error deleting objects batch:', error);
    throw error;
  }
};