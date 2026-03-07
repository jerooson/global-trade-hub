const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendBulkEmailRequest {
  subject: string;
  content: string;
  recipients: EmailRecipient[];
}

export interface SendBulkEmailResponse {
  success: boolean;
  campaignId: string;
  sentCount: number;
  failedCount: number;
  totalRecipients: number;
}

export interface EmailCampaign {
  id: string;
  subject: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: string;
  created_at: string;
  sent_at?: string;
}

export interface EmailRecipientStatus {
  email: string;
  name?: string;
  status: string;
  error_message?: string;
  sent_at?: string;
}

export interface CampaignDetails {
  campaign: EmailCampaign & { content: string };
  recipients: EmailRecipientStatus[];
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function sendBulkEmail(
  request: SendBulkEmailRequest
): Promise<SendBulkEmailResponse> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/api/email/send-bulk`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function getCampaigns(): Promise<EmailCampaign[]> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/api/email/campaigns`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.campaigns;
}

export async function getCampaignDetails(
  campaignId: string
): Promise<CampaignDetails> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/api/email/campaigns/${campaignId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
