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