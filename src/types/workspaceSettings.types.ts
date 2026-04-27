export interface IWorkspaceSettingsMember {
  id: string; // the User ID
  name: string;
  username?: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joinedAt?: Date;
}

export interface IWorkspaceSettingsPermissions {
  membersCanCreateChannels?: boolean;
  membersCanInvite?: boolean;
  membersCanDeleteMessages?: boolean;
}

export interface IWorkspaceSettingsInvite {
  _id?: string;
  id?: string;
  code: string;
  createdBy: { _id: string; name: string };
  maxUses: number;
  uses: number;
  expiresAt: Date | null;
  createdAt: Date;
}
