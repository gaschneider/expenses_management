import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { RoutesComponent } from "./components/RoutesComponent";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9" // You can customize these colors
    },
    secondary: {
      main: "#f48fb1" // You can customize these colors
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e"
    }
  }
});

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <RoutesComponent />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
