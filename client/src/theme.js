import { createTheme } from "@mui/material/styles";

const theme = createTheme({

  palette: {
    mode: "dark",

    primary: {
      main: "#3b82f6"   // soft blue accent (cleaner than green)
    },

    background: {
      default: "#0f172a",   // main page background (lighter than before)
      paper: "#1e293b"      // panels (problem, profile cards, etc.)
    },

    text: {
      primary: "#f1f5f9",    // readable white
      secondary: "#94a3b8"
    }
  },

  typography: {
    fontFamily: "Inter, Roboto, system-ui, sans-serif",
    button: {
      textTransform: "none",
      fontWeight: 600
    }
  },

  components: {

    /* NAVBAR */
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(30,41,59,0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #334155"
        }
      }
    },

    /* CARDS & PANELS */
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid #334155",
          borderRadius: 12
        }
      }
    },

    /* BUTTONS */
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingLeft: 16,
          paddingRight: 16
        }
      }
    },

    /* INPUT FIELDS */
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: "#0f172a",
          borderRadius: 8
        }
      }
    }

  }

});

export default theme;
