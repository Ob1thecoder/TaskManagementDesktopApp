export interface Service {
  id: number;
  name: string;
  command: string;
  workingDir?: string;
  projectId?: number;
  autoStart: boolean;
  createdAt: string;
}

export interface ServiceFormData {
  name: string;
  command: string;
  workingDir?: string;
  projectId?: number;
  autoStart: boolean;
}
