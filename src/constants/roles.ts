export const USER_TYPE = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    CUSTOMER: 'customer'
} as const;

export type UserRoleType = typeof USER_TYPE[keyof typeof USER_TYPE];
