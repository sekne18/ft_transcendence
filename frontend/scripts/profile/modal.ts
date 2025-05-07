import { init2FA } from "./2FA";

export class ModalManager {
    private modal: HTMLElement | null;

    constructor(modalId: string) {
        this.modal = document.getElementById(modalId);
    }

    init(
        onSubmit: (e: Event) => void,
        onReset: () => void,
        onAvatarChange?: () => void
    ) {
        const openModalBtn = document.getElementById('edit-profile-btn');
        const closeModalBtn = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-edit');
        const editProfileForm = document.getElementById('edit-profile-form');

        const closeModal = () => {
            this.hide();
            onReset();
        };

        if (openModalBtn) {
            openModalBtn.addEventListener('click', () => this.show());
        }
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeModal);
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeModal);
        }
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', onSubmit);
        }

        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        if (changeAvatarBtn && onAvatarChange) {
            changeAvatarBtn.addEventListener('click', onAvatarChange);
        }

        init2FA();
    }

    show() {
        this.modal?.classList.remove('hidden');
    }

    hide() {
        this.modal?.classList.add('hidden');
    }
}
