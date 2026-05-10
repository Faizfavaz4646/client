export interface IStatus {
  _id: string;
  name: string;
  workspaceId?: string;
  channelId?: string;
  isCompleted: boolean;
  order: number;
  color?: string;
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface ITask {
  _id: string;
  title: string;
  description: string;
  statusId: IStatus | string;
  priority: TaskPriority;
  channelId: string | any;
  workspaceId: string;
  orgId: string;
  createdBy: string | any;
  assignees: string[] | any[]; // Often populated with user details on fetch
  dueDate: string | Date | null;
  completedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
