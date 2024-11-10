import React from "react";
import { Avatar, Typography, useTheme } from "@mui/material";

// Define the props type
interface InitialsAvatarProps {
  firstName: string;
  lastName: string;
  size?: number;
}

const InitialsAvatar: React.FC<InitialsAvatarProps> = ({ firstName, lastName, size = 40 }) => {
  const theme = useTheme();

  const initials = `${firstName[0]?.toUpperCase() || ""}${lastName[0]?.toUpperCase() || ""}`;

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: theme.palette.primary.main,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: size / 2
      }}
    >
      <Typography
        variant="h6"
        sx={{ color: theme.palette.getContrastText(theme.palette.primary.main) }}
      >
        {initials}
      </Typography>
    </Avatar>
  );
};

export default InitialsAvatar;
