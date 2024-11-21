import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "./useCurrentUser";
import { useEffect, useMemo } from "react";
import { SystemPermission } from "../types/api";

// Is a OR permission validation, it will return true if the user has at least one
export const useUserHasPagePermission = (
  propPermissionsToCheck: SystemPermission | SystemPermission[],
  autoNavigate = true
) => {
  const { userHasPermission } = useCurrentUser();
  const navigate = useNavigate();

  const permissionsToCheck = useMemo(
    () =>
      Array.isArray(propPermissionsToCheck) ? propPermissionsToCheck : [propPermissionsToCheck],
    [propPermissionsToCheck]
  );

  const hasPermission = useMemo(
    () => permissionsToCheck.some((permission) => userHasPermission(permission)),
    [permissionsToCheck, userHasPermission]
  );

  useEffect(() => {
    if (!hasPermission && autoNavigate) {
      navigate("/home");
    }
  }, [autoNavigate, hasPermission, navigate, permissionsToCheck, userHasPermission]);

  return hasPermission;
};
