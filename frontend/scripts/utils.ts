export function getElement(id: string) {
  const element = document.getElementById(id);
  if (!element)
    throw new Error(`Element with id "${id}" not found`);
  return element;
}

// This function gets the data from the form and returns it as an object
export function getDataFromForm(formId: string): Record<string, string> {
  const form = document.getElementById(formId) as HTMLFormElement;
  const formData = new FormData(form);
  const data: Record<string, string> = {};

  formData.forEach((value, key) => {
    data[key] = value.toString();
  });
  return data;
}

export function showToast(title: string, description: string, type: 'success' | 'error' | 'warning' | 'info'): void {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `flex items-center p-4 mb-4 rounded-lg shadow ${type === 'success' ? 'bg-green-100 text-green-800' :
    type === 'error' ? 'bg-red-100 text-red-800' :
      type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
        'bg-blue-100 text-blue-800'
    }`;

  toast.innerHTML = `
      <div class="ml-3 text-sm font-medium">
          <div class="font-bold">${title}</div>
          <div>${description}</div>
      </div>
      <button type="button" class="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex h-8 w-8 text-gray-500 hover:text-gray-700" data-dismiss-target="#toast-success" aria-label="Close">
          <span class="sr-only">Close</span>
          <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
      </button>
  `;

  toastContainer.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.remove();
  }, 5000);

  // Remove on click
  const closeButton = toast.querySelector('button');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      toast.remove();
    });
  }
}