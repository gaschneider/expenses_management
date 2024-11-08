import { useState, useEffect } from "react";
import api from "../api/axios.config";
import { UserDTO } from "../types/api";

export const useCurrentUser = () => {
  const [user, setUser] = useState<UserDTO>();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get("/auth/status");
        setUser(response.data.user);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const userHasPermission = (permission: string) => {
    console.log(user);
    if (!user) return false;

    return !!user?.groups?.some((group) =>
      group.permissions?.some((perm) => perm.name === permission)
    );
  };

  return { user, userHasPermission };
};
