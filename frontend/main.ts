import './styles.css'
import { initRouter } from './scripts/router/router';
import { setEventHandlers } from './scripts/navbar/navbar';
import { initChat } from './scripts/chat/chat';

// Initial page load
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('auth-ready', async () => {
    initChat();
  });
  initRouter();
  setEventHandlers();
});