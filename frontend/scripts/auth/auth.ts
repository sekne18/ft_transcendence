import { loadContent } from "../router/router";
import { getDataFromForm, getElement } from "../utils";

/* 
    Run any logic from this function. 
    This function is called when a tab is pressed.
*/
export function initAuth(): void {
    setEvents();
}

function setEvents(): void {
    setLoginValidationEvents();
    setRegisterValidationEvents();
    handleTabSwitching();
    set2FaValidationEvents();
    setGoogleAuthEvents();
    handleAuth();

}

function setGoogleAuthEvents() {
    const clientId = "94330344622-l32lnl8uqlut2bko0ub5td9ddqamb8p8.apps.googleusercontent.com"; // Safe to expose
    const redirectUri = "http://localhost:3000/api/login/google/callback"; // Backend route
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=code&` +
        `scope=email profile&` +
        `access_type=offline&` +
        `prompt=consent`;

    document.getElementById("google-login")?.addEventListener("click", () => {
        window.location.href = authUrl;
    });
}

function handleTabSwitching() {
    const loginBtn = document.getElementById("tab-login");
    const registerBtn = document.getElementById("tab-register");
    const loginForm = document.getElementById("login-form") as HTMLFormElement;
    const registerForm = document.getElementById("register-form") as HTMLFormElement;

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

const authState = (function () {
    let tempToken: string | null = null;

    return {
        setTempToken: (token: string) => {
            tempToken = token;
        },
        getTempToken: () => tempToken,
        clearTempToken: () => {
            tempToken = null;
        }
    };
})();

function handleLogin(event: Event) {
    event.preventDefault();

    // Call to the backend to login the user
    const loginData = getDataFromForm('login-form');

    if (!loginData.email || !loginData.password)
        return;
    // For example, using fetch:
    fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
    })
        .then(res => {
            if (res.status === 401) {
                window.location.href = '/auth';
                return null;
            }
            return res.json();
        })
        .then(data => {
            if (data.success) {
                if (!data.twoFA) {
                    const newPath = '/';
                    history.pushState(null, '', newPath);
                    loadContent(newPath);
                }
                else {
                    const loginForm = getElement('login-form') as HTMLFormElement;
                    const tabsAuth = getElement('tabs-auth') as HTMLDivElement;
                    const twoFAForm = getElement('twofa-form') as HTMLFormElement;

                    if (loginForm && tabsAuth && twoFAForm) {

                        if (data.tempToken) {
                            authState.setTempToken(data.tempToken);
                        }

                        loginForm.classList.add('hidden');
                        tabsAuth.classList.add('hidden');
                        twoFAForm.classList.remove('hidden');
                    }
                }
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

function set2FaValidationEvents() {
    const backBtn = document.getElementById("backToLogin");
    const vertifyBtn = document.getElementById("vertify-btn");
    const loginForm = getElement('login-form') as HTMLFormElement;
    const tabsAuth = getElement('tabs-auth') as HTMLDivElement;
    const twoFAForm = getElement('twofa-form') as HTMLFormElement;


    if (backBtn && vertifyBtn) {
        backBtn.addEventListener("click", () => {
            // Clear the token when going back to the login form
            authState.clearTempToken();

            loginForm.classList.remove('hidden');
            tabsAuth.classList.remove('hidden');
            twoFAForm.classList.add('hidden');
        });
        vertifyBtn.addEventListener("click", () => {
            const twoFAData = getElement('twoFactorInput') as HTMLInputElement;
            if (!twoFAData.value)
                return;

            // Retrieve the temporary token from the closure
            const tempToken = authState.getTempToken();

            // Call to the backend to verify the 2FA code
            fetch('/api/2fa/verify', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempToken}`,
                },
                body: JSON.stringify({ code: twoFAData.value }),
            })
                .then(res => {
                    // if (res.status === 401) {
                    //     window.location.href = '/auth';
                    //     return null;
                    // }
                    return res.json();
                })
                .then(data => {
                    if (data.success) {
                        // Clear the token after successful verification
                        authState.clearTempToken();

                        const newPath = '/';
                        history.pushState(null, '', newPath);
                        loadContent(newPath);
                    } else {
                        const errMsg = document.getElementById("error-login-message");
                        if (errMsg) {
                            errMsg.innerText = data.message;
                        }
                    }
                })
                .catch(error => {
                    console.error('Error during 2FA verification:', error);
                    // Clear the token in case of errors
                    authState.clearTempToken();
                });
        });
    }
}

function handleRegister(event: Event) {
    event.preventDefault();

    const registerData = getDataFromForm('register-form');

    if (!registerData.username || !registerData.password || !registerData.email || !registerData.repassword)
        return;

    // Call to the backend to register the user 
    fetch('/api/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
    }).then(res => {
        if (res.status === 401) {
            window.location.href = '/auth';
            return null;
        }
        return res.json();
    }).then(data => {
        if (data.success) {
            // Redirect away from /auth after successful login
            const newPath = '/auth';
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