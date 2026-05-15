import type { EntityId, IsoDateString } from '@/src/types/common';

export type NotificationType =
  | 'FOLLOWUP_REMINDER'
  | 'CONSULTATION_UPDATE'
  | 'CONSULTATION_ASSIGNED'
  | 'CONSULTATION_CLOSED'
  | 'NEW_MESSAGE'
  | 'CHAT_MESSAGE'
  | 'TRIAGE_COMPLETE'
  | 'SYSTEM'
  | 'DOCTOR_STATUS_CHANGE'
  | 'FOLLOWUP_PRIORITY_ESCALATED';

export interface ListNotificationsInput {
  unreadOnly?: boolean;
  limit?: number;
}

export interface Notification {
  id?: EntityId;
  userId?: EntityId;
  type: NotificationType | string;
  status: string;
  message: string;
  resourceId?: EntityId;
  deepLink?: string | null;
  metadata?: Record<string, unknown> | null;
  read: boolean;
  readAt?: IsoDateString | null;
  createdAt?: IsoDateString | null;
  updatedAt?: IsoDateString | null;
}

export interface NotificationListItem {
  id: EntityId;
  type: NotificationType | string;
  status: string;
  message: string;
  resourceId?: EntityId;
  deepLink?: string | null;
  metadata?: Record<string, unknown> | null;
  read: boolean;
  readAt: IsoDateString | null;
  createdAt: IsoDateString | null;
}

export interface NotificationsResponse {
  items: NotificationListItem[];
  unreadCount: number;
}

export interface MarkNotificationAsReadResponse {
  id: EntityId;
  read: boolean;
  readAt: IsoDateString | null;
}

export interface MarkAllNotificationsAsReadResponse {
  updatedCount: number;
  readAt: IsoDateString;
}
