import { z } from "zod";

export const NotificationIdParamSchema = z.object({
    id: z.string().uuid({ message: "Notification ID must be a valid UUID" }),
});

export type NotificationIdParam = z.infer<typeof NotificationIdParamSchema>;
