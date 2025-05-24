import { languageService } from "../i18n";
import { getElement, showToast, protectedFetch } from "../utils";

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
            protectedFetch('/api/2fa/setup', {
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
                    showToast(languageService.retrieveValue('toast_failed_2FA_setup'), '', 'error');
                    ignoreToggleEvent = true;
                    toggle2FA.checked = false;
                }
            });
        } else {
            protectedFetch('/api/user/update', {
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
                    showToast(languageService.retrieveValue('toast_2FA_disabled'), '', 'success');
                    toggle2FA.checked = false;
                } else {
                    showToast(languageService.retrieveValue('toast_failed_2FA_disabled'), '', 'error');
                    ignoreToggleEvent = true;
                    toggle2FA.checked = true;
                }
            });
        }
    });

    const closeModal = () => {
        const codeInput = document.getElementById('2fa-code') as HTMLInputElement;
        codeInput.value = '';
        const errMsg = document.getElementById("error-modal-2fa-message");
        if (errMsg) {
            errMsg.innerText = '';
        }
        modal2FA.classList.add('hidden');
        // ignoreToggleEvent = true;
        toggle2FA.checked = false;
    };

    close2FAModal.addEventListener('click', closeModal);
    cancel2FA.addEventListener('click', closeModal);

    getElement('confirm-2fa').addEventListener('click', () => {
        const codeInput = document.getElementById('2fa-code') as HTMLInputElement;
        const code = codeInput.value.trim();
        if (code.length === 6 && /^[0-9]+$/.test(code)) {
            // Call api to verify the 2FA code
            protectedFetch('/api/2fa/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ code }),
            }).then((res) => {
                return res.json();
            }).then((res) => {
                if (res.success) {
                    showToast(languageService.retrieveValue('toast_2FA_enabled'), '', 'success');
                    ignoreToggleEvent = true;
                    toggle2FA.checked = true;
                    modal2FA.classList.add('hidden');
                } else {
                    const errMsg = document.getElementById("error-modal-2fa-message");
                    if (errMsg) {
                        errMsg.innerText = res.message;
                    }
                }
            });
        } else {
            showToast(languageService.retrieveValue('toast_6_digits'), '', 'error');
        }
    });
}