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
    // Call to the backend to login the user
    const loginData = getDataFromForm('login-form');

    // For example, using fetch:
    fetch('/api/login', {  })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const token = data.id; // Get the token from the response
                console.log('Login successful:', data);
                localStorage.setItem('access_token', token); // Store the token
                // Redirect away from /auth after successful login
                const newPath = '/';
                history.pushState(null, '', newPath);
                loadContent(newPath);
            } else {
                console.error('Login failed:', data.message);
            }
        })
        .catch(error => {
            console.error('Error during login:', error);
        });

    // Redirect away from /auth after successful login
    const newPath = '/';
    history.pushState(null, '', newPath);
    loadContent(newPath);
}

function handleRegister() {
    // Call to the backend to register the user 
    fetch('/api/register', {}) .then(response => response.json()).then(data => {
        if (data.success) {
            const token = data.id; // Get the token from the response
            console.log('Registration successful:', data);
            localStorage.setItem('access_token', token); // Store the token
            // Redirect away from /auth after successful login
            const newPath = '/';
            history.pushState(null, '', newPath);
            loadContent(newPath);
        } else {
            console.error('Registration failed:', data.message);
        }
    });
    // Redirect away from /auth after successful login
    const newPath = '/';
    history.pushState(null, '', newPath);
    loadContent(newPath);
}

function getDataFromForm(formId: string): Record<string, string> {
    const form = document.getElementById(formId) as HTMLFormElement;
    const formData = new FormData(form);
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
        data[key] = value.toString();
    });
    console.log(data);
    return data;
}