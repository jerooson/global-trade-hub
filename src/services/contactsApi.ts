const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface Contact {
  id: string;
  email: string;
  name: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateContactRequest {
  email: string;
  name?: string;
  tags?: string[];
}

export interface UpdateContactRequest {
  email?: string;
  name?: string;
  tags?: string[];
}

export interface BulkImportResponse {
  success: boolean;
  insertedCount: number;
  skippedCount: number;
  contacts: Contact[];
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getContacts(): Promise<Contact[]> {
  const response = await fetch(`${API_BASE_URL}/api/contacts`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ contacts: Contact[] }>(response);
  return data.contacts;
}

export async function createContact(
  request: CreateContactRequest
): Promise<Contact> {
  const response = await fetch(`${API_BASE_URL}/api/contacts`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  const data = await handleResponse<{ contact: Contact }>(response);
  return data.contact;
}

export async function bulkImportContacts(
  contacts: CreateContactRequest[]
): Promise<BulkImportResponse> {
  const response = await fetch(`${API_BASE_URL}/api/contacts/bulk`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ contacts }),
  });
  return handleResponse<BulkImportResponse>(response);
}

export async function updateContact(
  id: string,
  request: UpdateContactRequest
): Promise<Contact> {
  const response = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  const data = await handleResponse<{ contact: Contact }>(response);
  return data.contact;
}

export async function deleteContact(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  await handleResponse<{ success: boolean; id: string }>(response);
}
