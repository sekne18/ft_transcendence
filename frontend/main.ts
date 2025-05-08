import './styles.css'
import { initRouter } from './scripts/router/router';
import { setEventHandlers } from './scripts/navbar/navbar';

// Initial page load
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  setEventHandlers();
});