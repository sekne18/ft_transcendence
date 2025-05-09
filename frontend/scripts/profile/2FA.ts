import { getElement } from "../utils";

export function init2FA() {
    const toggle2FA = document.getElementById('toggle-2fa') as HTMLInputElement;
    const modal2FA = document.getElementById('modal-2fa') as HTMLDivElement;
    const close2FAModal = document.getElementById('close-2fa-modal') as HTMLButtonElement;
    const cancel2FA = document.getElementById('cancel-2fa') as HTMLButtonElement;
    const qrCode = document.getElementById('2fa-qr') as HTMLImageElement;
    const secretCode = document.getElementById('2fa-secret') as HTMLInputElement;
    let ignoreToggleEvent = false;

    toggle2FA.addEventListener('change', () => {
        if (ignoreToggleEvent) {
            ignoreToggleEvent = false;
            return;
        }

        if (toggle2FA.checked) {
            modal2FA.classList.remove('hidden');
            fetch('/api/2fa/setup', {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            }).then((res) => {
                if (res.status === 401) {
                    window.location.href = '/auth';
                    return null;
                }
                return res.json();
            }).then((res) => {
                if (res.success) {
                    qrCode.src = res.qrCode;
                    secretCode.textContent = res.secret;
                }
                else {
                    alert('Failed to set up 2FA. Please try again.');
                    ignoreToggleEvent = true;
                    toggle2FA.checked = false;
                }
            });
        } else {
            fetch('/api/user/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ twoFA: false }),
                credentials: 'include',
            }).then((res) => {
                if (res.status === 401) {
                    window.location.href = '/auth';
                    return null;
                }
                return res.json();
            }).then((res) => {
                if (res.success) {
                    alert('2FA disabled successfully!');
                    toggle2FA.checked = false;
                } else {
                    alert('Failed to disable 2FA');
                    ignoreToggleEvent = true;
                    toggle2FA.checked = true;
                }
            });
        }
    });

    const closeModal = () => {
        modal2FA.classList.add('hidden');
        ignoreToggleEvent = true;
        toggle2FA.checked = false;
    };

    close2FAModal.addEventListener('click', closeModal);
    cancel2FA.addEventListener('click', closeModal);

    getElement('confirm-2fa').addEventListener('click', () => {
        const codeInput = document.getElementById('2fa-code') as HTMLInputElement;
        const code = codeInput.value.trim();
        if (code.length === 6 && /^[0-9]+$/.test(code)) {
            console.log('Verifying 2FA with code:', code);
            // Call api to verify the 2FA code
            fetch('/api/2fa/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ code }),
            }).then((res) => {
                if (res.status === 401) {
                    window.location.href = '/auth';
                    return null;
                }
                return res.json();
            }).then((res) => {
                if (res.success) {
                    alert('2FA enabled successfully!');
                    ignoreToggleEvent = true;
                    toggle2FA.checked = true;
                    modal2FA.classList.add('hidden');
                } else {
                    alert('Failed to enable 2FA. Please try again.');
                    closeModal();
                }
            });
        } else {
            alert('Please enter a valid 6-digit code.');
        }
    });
}