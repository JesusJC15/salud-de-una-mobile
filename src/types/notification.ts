import type { EntityId, IsoDateString } from '@/src/types/common';

export interface ListNotificationsInput {
  unreadOnly?: boolean;
  limit?: number;
}

export interface Notification {
  id?: EntityId;
  userId?: EntityId;
  type: string;
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
  type: string;
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
