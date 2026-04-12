// src/lib/activity-log/constants.ts

export const ActivityAction = {
    LOGIN: "LOGIN",
    LOGOUT: "LOGOUT",
    CREATE: "CREATE",
    UPDATE: "UPDATE",
    DELETE: "DELETE",
} as const;

export const ActivityModule = {
    AUTH: "AUTH",
    BLINDS_PRODUCT: "BLINDS_PRODUCT",
    SALES_INVOICE: "SALES_INVOICE",
    USER: "USER",
    INVENTORY: "INVENTORY",
} as const;

export type ActivityActionType = (typeof ActivityAction)[keyof typeof ActivityAction];
export type ActivityModuleType = (typeof ActivityModule)[keyof typeof ActivityModule];