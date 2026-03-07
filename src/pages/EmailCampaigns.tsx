import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Send, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { sendBulkEmail, getCampaigns, EmailRecipient } from "@/services/emailApi";
import { LeftNavbar } from "@/components/layout/LeftNavbar";
import { TopHeader } from "@/components/layout/TopHeader";
import { useNavbar } from "@/hooks/useNavbar";
import { cn } from "@/lib/utils";

export default function EmailCampaigns() {
  const queryClient = useQueryClient();
  const { isCollapsed } = useNavbar();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipients, setRecipients] = useState<EmailRecipient[]>([{ email: "", name: "" }]);
  const [bulkEmails, setBulkEmails] = useState("");

  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: getCampaigns,
  });

  const sendEmailMutation = useMutation({
    mutationFn: sendBulkEmail,
    onSuccess: (data) => {
      toast.success(`Email campaign sent! ${data.sentCount} sent, ${data.failedCount} failed`);
      setSubject("");
      setContent("");
      setRecipients([{ email: "", name: "" }]);
      setBulkEmails("");
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send emails: ${error.message}`);
    },
  });

  const addRecipient = () => {
    setRecipients([...recipients, { email: "", name: "" }]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, field: keyof EmailRecipient, value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const parseBulkEmails = () => {
    const lines = bulkEmails.split("\n").filter((line) => line.trim());
    const parsed: EmailRecipient[] = [];

    for (const line of lines) {
      if (line.includes(",")) {
        const [email, name] = line.split(",").map((s) => s.trim());
        parsed.push({ email, name });
      } else {
        parsed.push({ email: line.trim() });
      }
    }

    setRecipients(parsed);
    setBulkEmails("");
    toast.success(`Added ${parsed.length} recipients`);
  };

  const handleSend = () => {
    const validRecipients = recipients.filter((r) => r.email.trim());

    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    if (validRecipients.length === 0) {
      toast.error("At least one recipient is required");
      return;
    }

    sendEmailMutation.mutate({
      subject,
      content,
      recipients: validRecipients,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      sending: "secondary",
      draft: "outline",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <LeftNavbar />
      
      <div className={cn("flex-1 flex flex-col transition-all duration-300", isCollapsed ? "ml-16" : "ml-56")}>
        <TopHeader 
          pageTitle="Email Campaigns"
          pageIcon={<Mail className="w-5 h-5 text-primary" />}
        />
        
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <p className="text-muted-foreground">
                Send bulk emails to multiple recipients
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Send Email Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send New Campaign</CardTitle>
              <CardDescription>
                Create and send a new email campaign to multiple recipients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input
                  placeholder="Email subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Content (HTML)</label>
                <Textarea
                  placeholder="Email content (HTML supported)..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Recipients</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRecipient}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recipients.map((recipient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="email@example.com"
                        value={recipient.email}
                        onChange={(e) => updateRecipient(index, "email", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Name (optional)"
                        value={recipient.name || ""}
                        onChange={(e) => updateRecipient(index, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRecipient(index)}
                        disabled={recipients.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Or Bulk Import (one per line, email or email,name)
                </label>
                <Textarea
                  placeholder="user@example.com&#10;john@example.com,John Doe&#10;jane@example.com,Jane Smith"
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={parseBulkEmails}
                  disabled={!bulkEmails.trim()}
                  className="mt-2"
                >
                  Parse Bulk Emails
                </Button>
              </div>

              <Button
                onClick={handleSend}
                disabled={sendEmailMutation.isPending}
                className="w-full"
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Campaign
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Campaign History */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign History</CardTitle>
              <CardDescription>View your recent email campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCampaigns ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : campaigns && campaigns.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">{campaign.subject}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(campaign.created_at).toLocaleString()}
                          </p>
                        </div>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Total: {campaign.total_recipients}</span>
                        <span className="text-green-600">Sent: {campaign.sent_count}</span>
                        {campaign.failed_count > 0 && (
                          <span className="text-red-600">Failed: {campaign.failed_count}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No campaigns yet</p>
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
