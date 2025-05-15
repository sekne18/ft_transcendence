import './styles.css'
import { initRouter } from './scripts/router/router';
import { setEventHandlers } from './scripts/navbar/navbar';
import { initChat } from './scripts/chat/chat';
import { checkAuth } from './scripts/router/router';

// Initial page load
document.addEventListener('DOMContentLoaded', () => {
  // const intervalId = setInterval(async () => {
  //   const chatToggle = document.getElementById("chat-toggle") as HTMLButtonElement;
  //   const chatWindow = document.getElementById("chat-window") as HTMLDivElement;

  //   if (chatToggle && chatWindow && await checkAuth()) {
  //     clearInterval(intervalId);
  //     initChat();
  //   }
  // }, 1000);
  document.addEventListener('auth-ready', async () => {
    initChat();
  });
  initRouter();
  setEventHandlers();
});