export interface Project {
  id: number;
  name: string;
  path: string;
  projectType?: string;
  description?: string;
  lastAccessed?: string;
  createdAt: string;
}

export interface ProjectFormData {
  name: string;
  path: string;
}
