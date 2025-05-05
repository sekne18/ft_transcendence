import { loadContent } from "../router/router";

/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
export function initAuth(): void {
    setEvents();
}

function setEvents(): void {
    const loginBtn = document.getElementById("tab-login");
    const registerBtn = document.getElementById("tab-register");
    const loginForm = document.getElementById("login-form") as HTMLFormElement;
    const registerForm = document.getElementById("register-form") as HTMLFormElement;
    const loginUserBtn = document.getElementById("login-btn");
    const registerUserBtn = document.getElementById("register-btn");


    if (loginBtn && registerBtn) {
        loginBtn.addEventListener("click", () => {
            if (loginForm && registerForm) {
                loginForm.classList.remove("hidden");
                loginForm.classList.add("flex");

                loginForm.classList.add("flex");
                registerForm.classList.add("hidden");

                registerBtn.classList.remove("border-b-2", "border-blue-500");
                loginBtn.classList.add("border-b-2", "border-blue-500");
            }
        });

        registerBtn.addEventListener("click", () => {
            if (loginForm && registerForm) {
                registerForm.classList.remove("hidden");
                registerForm.classList.add("flex");

                loginForm.classList.add("hidden");
                registerForm.classList.add("flex");

                loginBtn.classList.remove("border-b-2", "border-blue-500");
                registerBtn.classList.add("border-b-2", "border-blue-500");
            }
        });
    }
    if (loginUserBtn) {
        loginUserBtn.addEventListener("click", () => {
            // TODO: SANITIZE THE FORM
            if (loginForm) {
                handleLogin();
            }
        });
    }
    if (registerUserBtn) {
        registerUserBtn.addEventListener("click", () => {
            if (registerForm) {
                handleRegister();
            }
        });
    }
}

function handleLogin() {
    localStorage.setItem('access_token', 'your_token_here'); // replace with the actual token

    // Redirect away from /auth after successful login
    const newPath = '/';
    history.pushState(null, '', newPath);
    loadContent(newPath);
}

function handleRegister() {
    // Call to the backend to register the user 

    // Redirect away from /auth after successful login
    const newPath = '/';
    history.pushState(null, '', newPath);
    loadContent(newPath);
}