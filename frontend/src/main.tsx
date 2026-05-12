import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import { theme } from './theme/theme';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root element in index.html');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
