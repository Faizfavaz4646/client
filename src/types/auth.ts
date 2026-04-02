export interface IUserSafe {
    id: string;
    name: string;
    email: string;
    username: string;
    avatar: string;
    status: string;
    organizations: Array<{ orgId: string; role: string; joinedAt: string }>;
    workspaces: Array<{ workspaceId: string; name: string; joinedAt: string }>;
}
