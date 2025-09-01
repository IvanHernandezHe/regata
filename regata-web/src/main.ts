import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Initialize Bootstrap color mode before Angular bootstraps
(() => {
  try {
    const saved = localStorage.getItem('theme');
    const theme = saved === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', theme);
  } catch {
    // no-op (e.g., storage unavailable)
  }
})();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
