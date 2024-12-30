import { SystemPermission } from "../types/api";
import { useAuth } from "../contexts/AuthContext";

export const useCurrentUser = () => {
  const { user } = useAuth();

  const userHasPermission = (permission: string, departmentId?: number) => {
    if (!user) return false;

    if (user.permissions?.includes(SystemPermission.ADMIN)) {
      return true;
    }

    if (departmentId) {
      return user.departmentPermissions?.[departmentId]?.includes(permission);
    }
    return user.permissions?.includes(permission);
  };

  return { user: user!, userHasPermission };
};
