const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface GenerateImageRequest {
  prompt: string;
  aspectRatio?: string;
}

export interface EditImageRequest {
  prompt: string;
  imageBase64: string;
  aspectRatio?: string;
}

export interface ImageResponse {
  success: boolean;
  image: string; // base64
  prompt: string;
  aspectRatio: string;
}

export async function generateImage(request: GenerateImageRequest): Promise<ImageResponse> {
  const token = localStorage.getItem("accessToken");
  
  if (!token) {
    throw new Error("Not authenticated. Please log in again.");
  }

  const response = await fetch(`${API_URL}/api/image/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate image");
  }

  return response.json();
}

export async function editImage(request: EditImageRequest): Promise<ImageResponse> {
  const token = localStorage.getItem("accessToken");
  
  if (!token) {
    throw new Error("Not authenticated. Please log in again.");
  }

  const response = await fetch(`${API_URL}/api/image/edit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to edit image");
  }

  return response.json();
}

