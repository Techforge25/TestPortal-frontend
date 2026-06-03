export {
  getAdminNotificationSettings,
  getAdminSecurityDefaults,
  listAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  saveAdminNotificationSettings,
  saveAdminSecurityDefaults,
} from "@/data.admin/shared/backendApi";

export type {
  AdminNotificationItem,
  AdminSecurityDefaults,
} from "@/data.admin/shared/backendApi";
