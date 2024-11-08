export type UserDTO = {
  id?: number;
  email: string;
  groups?: GroupDTO[];
};

export type GroupDTO = {
  id?: number;
  name: string;
  description: string;
  permissions?: PermissionDTO[];
};

export type PermissionDTO = {
  id?: number;
  name: string;
  description: string;
};
