import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// ⭐ MUI THEME
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
      <ToastContainer position="top-right" theme="dark" />
    </ThemeProvider>
  </React.StrictMode>,
)
