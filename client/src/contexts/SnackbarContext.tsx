import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

type PositionType = {
  vertical: "top" | "bottom";
  horizontal: "left" | "center" | "right";
};

interface SnackbarOptions {
  severity?: AlertColor;
  duration?: number;
  position?: PositionType;
}

interface ShowSnackbar {
  (message: string, options?: SnackbarOptions): void;
}

interface SnackbarContextValue {
  showSnackbar: ShowSnackbar;
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);

interface SnackbarProviderProps {
  children: ReactNode;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AlertColor>("success");
  const [duration, setDuration] = useState(6000);
  const [position, setPosition] = useState<PositionType>({
    vertical: "bottom" as const,
    horizontal: "center" as const
  });

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const showSnackbar: ShowSnackbar = useCallback((message, options = {}) => {
    setMessage(message);
    setSeverity(options.severity || "success");
    setDuration(options.duration || 6000);
    setPosition(options.position || { vertical: "bottom", horizontal: "center" });
    setOpen(true);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={duration}
        onClose={handleClose}
        anchorOrigin={position}
      >
        <Alert onClose={handleClose} severity={severity} variant="filled" elevation={6}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): ShowSnackbar => {
  const context = useContext(SnackbarContext);

  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }

  return context.showSnackbar;
};

export default SnackbarProvider;
