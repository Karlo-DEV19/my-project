import { ActivityActionType, ActivityModuleType } from "../constans/activity-log";

export type ActivityLog = {
  id: string;
  action: ActivityActionType;
  module: ActivityModuleType;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
  userId: string;

  actorName: string;
  actorEmail: string;
  actorRole: string;
};