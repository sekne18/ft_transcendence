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

    setLoginValidationEvents();
    setRegisterValidationEvents();


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
    handleAuth();
}


function handleAuth() {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (regForm) {
        regForm.addEventListener('submit', handleRegister);
    }
}

function handleLogin(event: Event) {
    event.preventDefault();

    // Call to the backend to login the user
    const loginData = getDataFromForm('login-form');

    if (!loginData.email || !loginData.password)
        return;

    // For example, using fetch:
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const userId = data.id;
                localStorage.setItem('userId', userId); //TODO: For now, just store the userId

                const newPath = '/';
                history.pushState(null, '', newPath);
                loadContent(newPath);
            } else {
                const loginBtn = document.getElementById("login-email");
                const registerBtn = document.getElementById("login-password");

                if (loginBtn && registerBtn) {
                    loginBtn.classList.add("outline-none", "ring-2", "ring-red-500");
                    registerBtn.classList.add("outline-none", "ring-2", "ring-red-500");
                }
                const errMsg = document.getElementById("error-login-message");
                if (errMsg) {
                    errMsg.innerText = data.message;
                }
            }
        })
        .catch(error => {
            console.error('Error during login:', error);
        });
}

function handleRegister(event: Event) {
    event.preventDefault();

    const registerData = getDataFromForm('register-form');

    if (!registerData.username || !registerData.password || !registerData.email || !registerData.repassword)
        return;

    // Call to the backend to register the user 
    fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
    }).then(response => response.json()).then(data => {
        if (data.success) {
            const userId = data.id;
            localStorage.setItem('userId', userId); //TODO: For now, just store the userId

            // Redirect away from /auth after successful login
            const newPath = '/';
            history.pushState(null, '', newPath);
            loadContent(newPath);
        } else {
            const registerUsernameInput = document.getElementById("register-username");
            const registerInput = document.getElementById("register-email");
            const registerPasswordInput = document.getElementById("register-password");
            const registerRePasswordInput = document.getElementById("register-confirm");

            if (registerUsernameInput && registerInput && registerPasswordInput && registerRePasswordInput) {
                registerUsernameInput.classList.add("outline-none", "ring-2", "ring-red-500");
                registerInput.classList.add("outline-none", "ring-2", "ring-red-500");
                registerPasswordInput.classList.add("outline-none", "ring-2", "ring-red-500");
                registerRePasswordInput.classList.add("outline-none", "ring-2", "ring-red-500");
            }
            // Display error message to the user
            const errMsg = document.getElementById("error-register-message");
            if (errMsg) {
                errMsg.innerText = data.message;
            }
        }
    }).catch(error => {
        console.error('Error during registration:', error);
    });
}

// This function gets the data from the form and returns it as an object
function getDataFromForm(formId: string): Record<string, string> {
    const form = document.getElementById(formId) as HTMLFormElement;
    const formData = new FormData(form);
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
        data[key] = value.toString();
    });
    return data;
}

// This function removes the red outline when the user clicks on the input field
function setRegisterValidationEvents() {
    const registerUsernameInput = document.getElementById("register-username");
    const registerInput = document.getElementById("register-email");
    const registerPasswordInput = document.getElementById("register-password");
    const registerRePasswordInput = document.getElementById("register-repassword");

    if (registerInput && registerPasswordInput && registerRePasswordInput && registerUsernameInput) {
        registerInput.addEventListener("focus", () => {
            registerInput.classList.remove("outline-none", "ring-2", "ring-red-500");
        });
        registerPasswordInput.addEventListener("focus", () => {
            registerPasswordInput.classList.remove("outline-none", "ring-2", "ring-red-500");
        });
        registerRePasswordInput.addEventListener("focus", () => {
            registerRePasswordInput.classList.remove("outline-none", "ring-2", "ring-red-500");
        });
        registerUsernameInput.addEventListener("focus", () => {
            registerUsernameInput.classList.remove("outline-none", "ring-2", "ring-red-500");
        });
    }
}

// This function removes the red outline when the user clicks on the input field
function setLoginValidationEvents() {
    const loginInput = document.getElementById("login-email");
    const registerInput = document.getElementById("login-password");

    if (loginInput && registerInput) {
        loginInput.addEventListener("focus", () => {
            loginInput.classList.remove("outline-none", "ring-2", "ring-red-500");
        });
        registerInput.addEventListener("focus", () => {
            registerInput.classList.remove("outline-none", "ring-2", "ring-red-500");
        });
    }
}