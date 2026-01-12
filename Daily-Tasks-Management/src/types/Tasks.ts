export interface Task {
  id: number;
  title: string;
  priority: 1 | 2 | 3 | 4 | 5;
  deadline: string;            
  estimatedTime: number;       
  startDate?: string;          
  scheduledStart?: string;     
  completed: boolean;
  locked: boolean;
  category?: string;
  reminderEnabled: boolean;
  reminderMinutes: number;
  projectId?: number;
  createdAt: string;          
}

export interface TaskFormData {
  title: string;
  priority: string;
  deadline: string;
  estimatedHours: string;
  estimatedMinutes: string;
  startDate: string;
}
