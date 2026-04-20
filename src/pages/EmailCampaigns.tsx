import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail, Send, Loader2, Plus, X, Eye,
  History, Users, PenSquare, Trash2, UserPlus,
  Sparkles, RefreshCw, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { sendBulkEmail, getCampaigns, EmailRecipient } from "@/services/emailApi";
import {
  getContacts,
  createContact,
  bulkImportContacts,
  deleteContact,
  Contact,
} from "@/services/contactsApi";
import { LeftNavbar } from "@/components/layout/LeftNavbar";
import { TopHeader } from "@/components/layout/TopHeader";
import { useNavbar } from "@/hooks/useNavbar";
import { cn } from "@/lib/utils";

type Tab = "compose" | "history" | "contacts";

function parseTags(raw: string): string[] {
  return raw.split(/[,|]/).map((t) => t.trim().toLowerCase()).filter(Boolean);
}

function tagColorClass(tag: string | undefined): string {
  if (!tag) return "bg-muted text-muted-foreground";
  const palette = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400",
  ];
  const idx = tag.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return palette[idx];
}

const LOCAL_STORAGE_KEY = "gth_contacts";
const MIGRATION_DONE_KEY = "gth_contacts_migrated_v1";

export default function EmailCampaigns() {
  const queryClient = useQueryClient();
  const { isCollapsed } = useNavbar();
  const [activeTab, setActiveTab] = useState<Tab>("compose");

  // Compose state
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipients, setRecipients] = useState<EmailRecipient[]>([{ email: "", name: "" }]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(new Set());

  // AI writer state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGenerated, setAiGenerated] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [aiImageUrls, setAiImageUrls] = useState<string[]>([]);
  const [aiImageInput, setAiImageInput] = useState("");
  const aiPromptRef = useRef<HTMLInputElement>(null);

  // Contacts state (backed by API)
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: getContacts,
  });

  const invalidateContacts = () =>
    queryClient.invalidateQueries({ queryKey: ["contacts"] });

  const createContactMutation = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      invalidateContacts();
      toast.success("Contact added");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add contact"),
  });

  const bulkImportMutation = useMutation({
    mutationFn: bulkImportContacts,
    onSuccess: (data) => {
      invalidateContacts();
      const msg =
        data.skippedCount > 0
          ? `Imported ${data.insertedCount} contacts (${data.skippedCount} duplicates skipped)`
          : `Imported ${data.insertedCount} contacts`;
      toast.success(msg);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to import contacts"),
  });

  const deleteContactMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      invalidateContacts();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete contact"),
  });

  // One-time localStorage -> database migration
  useEffect(() => {
    if (localStorage.getItem(MIGRATION_DONE_KEY)) return;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(MIGRATION_DONE_KEY, "1");
        return;
      }
      const legacy = JSON.parse(raw) as Array<{
        email: string;
        name?: string;
        tags?: string[];
      }>;
      if (!Array.isArray(legacy) || legacy.length === 0) {
        localStorage.setItem(MIGRATION_DONE_KEY, "1");
        return;
      }
      bulkImportContacts(
        legacy.map((c) => ({
          email: c.email,
          name: c.name || "",
          tags: c.tags || [],
        }))
      )
        .then((res) => {
          localStorage.setItem(MIGRATION_DONE_KEY, "1");
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          invalidateContacts();
          if (res.insertedCount > 0) {
            toast.success(`Migrated ${res.insertedCount} contacts to your account`);
          }
        })
        .catch(() => {
          // Silently fail; will retry on next load
        });
    } catch {
      localStorage.setItem(MIGRATION_DONE_KEY, "1");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [bulkContactImport, setBulkContactImport] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [pickerTagFilter, setPickerTagFilter] = useState<string | null>(null);

  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: getCampaigns,
  });

  const sendEmailMutation = useMutation({
    mutationFn: sendBulkEmail,
    onSuccess: (data) => {
      toast.success(`Campaign sent — ${data.sentCount} delivered, ${data.failedCount} failed`);
      setSubject("");
      setContent("");
      setRecipients([{ email: "", name: "" }]);
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send: ${error.message}`);
    },
  });

  // ── Compose helpers ──────────────────────────────────────────────────────────
  const addRecipient = () => setRecipients([...recipients, { email: "", name: "" }]);

  const removeRecipient = (index: number) => {
    const updated = recipients.filter((_, i) => i !== index);
    setRecipients(updated.length > 0 ? updated : [{ email: "", name: "" }]);
  };

  const updateRecipient = (index: number, field: keyof EmailRecipient, value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const handleSend = () => {
    const valid = recipients.filter((r) => r.email.trim());
    if (!subject.trim()) return toast.error("Subject is required");
    if (!content.trim()) return toast.error("Content is required");
    if (valid.length === 0) return toast.error("At least one recipient is required");
    sendEmailMutation.mutate({ subject, content, recipients: valid });
  };

  // ── AI Writer helpers ─────────────────────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const openAiWriter = () => {
    setAiOpen(true);
    setAiGenerated("");
    setAiPrompt("");
    setAiImageUrls([]);
    setAiImageInput("");
    setRefineOpen(false);
    setTimeout(() => aiPromptRef.current?.focus(), 50);
  };

  const closeAiWriter = () => {
    setAiOpen(false);
    setAiGenerated("");
    setAiPrompt("");
    setAiImageUrls([]);
    setAiImageInput("");
    setRefineOpen(false);
  };

  const addAiImageUrl = () => {
    const urls = aiImageInput
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u && u.startsWith("http") && !aiImageUrls.includes(u));
    if (urls.length === 0) return;
    setAiImageUrls((prev) => [...prev, ...urls]);
    setAiImageInput("");
  };

  const removeAiImageUrl = (url: string) =>
    setAiImageUrls((prev) => prev.filter((u) => u !== url));

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    // Detect "/" typed alone or as the last character on a new line
    if (val === "/" || val.endsWith("\n/")) {
      setContent(val === "/" ? "" : val.slice(0, -1));
      openAiWriter();
    } else {
      setContent(val);
    }
  };

  const generateContent = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiGenerated("");
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE}/api/email/generate-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: aiPrompt, subject, tone: aiTone, imageUrls: aiImageUrls }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAiGenerated(data.content);
    } catch {
      toast.error("Failed to generate content — is the backend running?");
    } finally {
      setAiGenerating(false);
    }
  };

  const refineContent = async () => {
    if (!aiGenerated.trim() || !refineInstruction.trim()) return;
    setRefining(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE}/api/email/refine-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: aiGenerated, instruction: refineInstruction }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAiGenerated(data.content);
      setRefineInstruction("");
      setRefineOpen(false);
    } catch {
      toast.error("Failed to refine content");
    } finally {
      setRefining(false);
    }
  };

  const insertAiContent = () => {
    setContent(aiGenerated);
    closeAiWriter();
    toast.success("AI content inserted");
  };

  // ── Contact helpers ──────────────────────────────────────────────────────────
  const addContact = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return toast.error("Email is required");
    if (contacts.some((c) => c.email === email))
      return toast.error("Contact already exists");
    // Flush any pending tag input
    const pendingTag = newTagInput.trim().toLowerCase();
    const finalTags = pendingTag && !newTags.includes(pendingTag)
      ? [...newTags, pendingTag]
      : newTags;
    createContactMutation.mutate(
      { email, name: newName.trim(), tags: finalTags },
      {
        onSuccess: () => {
          setNewEmail("");
          setNewName("");
          setNewTags([]);
          setNewTagInput("");
        },
      }
    );
  };

  const addTagChip = () => {
    const tag = newTagInput.trim().toLowerCase();
    if (!tag) return;
    if (!newTags.includes(tag)) setNewTags([...newTags, tag]);
    setNewTagInput("");
  };

  const removeTagChip = (tag: string) =>
    setNewTags(newTags.filter((t) => t !== tag));

  const removeContact = (id: string) => {
    deleteContactMutation.mutate(id);
  };

  const importBulkContacts = () => {
    const lines = bulkContactImport.split("\n").filter((l) => l.trim());
    const toImport: { email: string; name: string; tags: string[] }[] = [];
    for (const line of lines) {
      const parts = line.split(",").map((s) => s.trim());
      const email = parts[0];
      const name = parts[1] || "";
      const tags = parts[2] ? parseTags(parts[2]) : [];
      if (email) {
        toImport.push({ email: email.toLowerCase(), name, tags });
      }
    }
    if (toImport.length === 0) {
      toast.error("No valid contacts found");
      return;
    }
    bulkImportMutation.mutate(toImport, {
      onSuccess: () => setBulkContactImport(""),
    });
  };

  const useContactsInCampaign = () => {
    const filtered = filteredContacts;
    setRecipients(filtered.map((c) => ({ email: c.email, name: c.name })));
    setActiveTab("compose");
    toast.success(`${filtered.length} contacts added to campaign`);
  };

  // ── Derived lists ─────────────────────────────────────────────────────────
  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags))).sort();

  // ── Contact picker helpers ────────────────────────────────────────────────
  const pickerFiltered = contacts.filter((c) => {
    const matchSearch = pickerSearch
      ? c.email.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        c.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        c.tags.some((t) => t.includes(pickerSearch.toLowerCase()))
      : true;
    const matchTag = pickerTagFilter ? c.tags.includes(pickerTagFilter) : true;
    return matchSearch && matchTag;
  });

  const togglePickerContact = (id: string) => {
    setPickerSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePickerAll = () => {
    if (pickerSelected.size === pickerFiltered.length) {
      setPickerSelected(new Set());
    } else {
      setPickerSelected(new Set(pickerFiltered.map((c) => c.id)));
    }
  };

  const applyPickerSelection = () => {
    const chosen = contacts.filter((c) => pickerSelected.has(c.id));
    const existing = recipients.filter((r) => r.email.trim());
    const existingEmails = new Set(existing.map((r) => r.email));
    const toAdd = chosen
      .filter((c) => !existingEmails.has(c.email))
      .map((c) => ({ email: c.email, name: c.name }));
    setRecipients([...existing, ...toAdd]);
    setContactPickerOpen(false);
    setPickerSelected(new Set());
    setPickerSearch("");
    toast.success(`${toAdd.length} contact${toAdd.length !== 1 ? "s" : ""} added`);
  };

  const openContactPicker = () => {
    setPickerSelected(new Set());
    setPickerSearch("");
    setPickerTagFilter(null);
    setContactPickerOpen(true);
  };

  const filteredContacts = contacts.filter((c) => {
    const matchSearch = contactSearch
      ? c.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.tags.some((t) => t.includes(contactSearch.toLowerCase()))
      : true;
    const matchTag = activeTagFilter ? c.tags.includes(activeTagFilter) : true;
    return matchSearch && matchTag;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      sending: "secondary",
      draft: "outline",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "compose", label: "New Campaign", icon: PenSquare },
    { id: "history", label: "Campaign History", icon: History },
    { id: "contacts", label: "Contact Management", icon: Users },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <LeftNavbar />

      <div className={cn("flex-1 flex flex-col transition-all duration-300", isCollapsed ? "ml-16" : "ml-56")}>
        <TopHeader
          pageTitle="Email Campaigns"
          pageIcon={<Mail className="w-3.5 h-3.5 text-primary" />}
        />

        {/* Sub-navigation */}
        <div className="border-b border-border bg-background shrink-0">
          <div className="flex gap-0 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors font-display tracking-wide",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">

            {/* ── Compose Tab ─────────────────────────────────────────────────── */}
            {activeTab === "compose" && (
              <Card>
                <CardHeader>
                  <CardTitle>New Campaign</CardTitle>
                  <CardDescription>Compose and send an email campaign to your recipients</CardDescription>
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
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        Content (HTML)
                        <span className="text-[10px] text-muted-foreground font-normal border border-border rounded px-1 py-0.5 font-mono">
                          / for AI
                        </span>
                        <span className="text-[10px] text-primary/80 font-normal border border-primary/30 rounded px-1 py-0.5 font-mono bg-primary/5">
                          {"{{firstName}}"} for personalization
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={openAiWriter}
                          className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          AI Write
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewOpen(true)}
                          disabled={!content.trim()}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          Preview
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      placeholder={"Write your HTML email content here...\n\nTip: Type  /  to open the AI writing assistant"}
                      value={content}
                      onChange={handleContentChange}
                      rows={aiOpen ? 4 : 8}
                      className="font-mono text-sm transition-all"
                    />

                    {/* ── AI Writer Panel ── */}
                    {aiOpen && (
                      <div className="mt-2 border border-primary/30 rounded-lg bg-card shadow-lg overflow-hidden animate-fade-up">

                        {/* Prompt row */}
                        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                          <Sparkles className="w-4 h-4 text-primary shrink-0" />
                          <input
                            ref={aiPromptRef}
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey && !aiGenerating) {
                                e.preventDefault();
                                generateContent();
                              }
                              if (e.key === "Escape") closeAiWriter();
                            }}
                            placeholder="Describe the email you want to write…"
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                          />
                          {/* Tone selector */}
                          <select
                            value={aiTone}
                            onChange={(e) => setAiTone(e.target.value)}
                            className="text-xs bg-muted border border-border rounded px-2 py-1 text-muted-foreground outline-none cursor-pointer"
                          >
                            <option value="professional">Professional</option>
                            <option value="friendly">Friendly</option>
                            <option value="urgent">Urgent</option>
                            <option value="formal">Formal</option>
                            <option value="casual">Casual</option>
                          </select>
                        </div>

                        {/* Image URLs row */}
                        <div className="px-3 py-2 border-b border-border bg-muted/10">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                              Product pages or image URLs
                            </p>
                            <span className="text-[10px] text-muted-foreground/60">
                              {aiImageUrls.length > 0 ? `${aiImageUrls.length} added` : "optional"}
                            </span>
                          </div>
                          <div className="flex gap-2 items-start">
                            <textarea
                              value={aiImageInput}
                              onChange={(e) => setAiImageInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addAiImageUrl(); }
                              }}
                              placeholder={"Paste one or more URLs, one per line:\nhttps://yoursite.com/product-1/\nhttps://yoursite.com/product-2/"}
                              rows={aiImageInput.split("\n").length > 1 ? Math.min(aiImageInput.split("\n").length + 1, 4) : 2}
                              className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary/50 resize-none leading-relaxed"
                            />
                            <button
                              onClick={addAiImageUrl}
                              disabled={!aiImageInput.trim()}
                              className="text-xs px-2.5 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground disabled:opacity-40 transition-colors shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[10px] text-muted-foreground/50 mt-1">
                            Product page URLs are supported — images will be extracted automatically
                          </p>
                          {aiImageUrls.length > 0 && (
                            <div className="flex flex-col gap-1 mt-2">
                              {aiImageUrls.map((url, idx) => (
                                <div key={url} className="flex items-center gap-2 bg-background border border-border rounded px-2 py-1">
                                  <span className="text-[10px] text-muted-foreground/60 shrink-0 w-4 text-right">{idx + 1}</span>
                                  <span className="text-[10px] text-muted-foreground truncate flex-1">{url}</span>
                                  <button onClick={() => removeAiImageUrl(url)} className="text-muted-foreground hover:text-destructive shrink-0 transition-colors">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Generated content preview */}
                        {aiGenerated && (
                          <div className="border-b border-border">
                            <div className="px-3 py-2 bg-muted/30 flex items-center justify-between">
                              <span className="text-xs text-muted-foreground truncate max-w-xs italic">"{aiPrompt}"</span>
                              <span className="text-[10px] text-primary font-medium">Generated</span>
                            </div>
                            {aiGenerated.trimStart().startsWith("<") ? (
                              <div
                                className="px-4 py-3 max-h-52 overflow-y-auto text-sm text-foreground/80 prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: aiGenerated }}
                              />
                            ) : (
                              <pre
                                className="px-4 py-3 max-h-52 overflow-y-auto text-sm text-foreground/80 whitespace-pre-wrap font-sans"
                              >
                                {aiGenerated}
                              </pre>
                            )}
                          </div>
                        )}

                        {/* Refine row */}
                        {refineOpen && aiGenerated && (
                          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/20">
                            <input
                              autoFocus
                              value={refineInstruction}
                              onChange={(e) => setRefineInstruction(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") refineContent();
                                if (e.key === "Escape") setRefineOpen(false);
                              }}
                              placeholder="How should I refine it? (e.g. make it shorter, more urgent…)"
                              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            />
                            <Button size="sm" onClick={refineContent} disabled={refining || !refineInstruction.trim()}>
                              {refining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                            </Button>
                            <button onClick={() => setRefineOpen(false)} className="text-muted-foreground hover:text-foreground">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Action bar */}
                        <div className="flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={closeAiWriter}
                              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                            >
                              Cancel
                            </button>
                            {aiGenerated && (
                              <>
                                <button
                                  onClick={generateContent}
                                  disabled={aiGenerating}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                                >
                                  <RefreshCw className={cn("w-3 h-3", aiGenerating && "animate-spin")} />
                                  Recreate
                                </button>
                                <button
                                  onClick={() => setRefineOpen((v) => !v)}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                                >
                                  Refine
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={aiGenerated ? insertAiContent : generateContent}
                            disabled={aiGenerating || (!aiGenerated && !aiPrompt.trim())}
                            className="gap-1.5"
                          >
                            {aiGenerating ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                            ) : aiGenerated ? (
                              "Insert"
                            ) : (
                              <><Sparkles className="w-3.5 h-3.5" /> Create</>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">
                        Recipients
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          {recipients.filter((r) => r.email.trim()).length} added
                        </span>
                      </label>
                      <div className="flex gap-2">
                        {contacts.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={openContactPicker}
                          >
                            <Users className="w-3.5 h-3.5 mr-1.5" />
                            From Contacts
                          </Button>
                        )}
                        <Button type="button" variant="outline" size="sm" onClick={addRecipient}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Column labels */}
                    <div className="flex gap-2 mb-1.5 px-1">
                      <div className="flex-1">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                          Email
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
                          Name
                          <span className="text-[10px] normal-case text-primary/70 font-mono font-normal border border-primary/20 rounded px-1 bg-primary/5">
                            used for {"{{firstName}}"}
                          </span>
                        </p>
                      </div>
                      <div className="w-10" />
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto p-1 -mx-1">
                      {recipients.map((recipient, index) => {
                        const firstName = recipient.name?.trim().split(/\s+/)[0];
                        return (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder="email@example.com"
                              value={recipient.email}
                              onChange={(e) => updateRecipient(index, "email", e.target.value)}
                              className="flex-1"
                            />
                            <div className="flex-1 relative">
                              <Input
                                placeholder="John Smith"
                                value={recipient.name || ""}
                                onChange={(e) => updateRecipient(index, "name", e.target.value)}
                                className="w-full pr-20"
                              />
                              {firstName && (
                                <span
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary/70 font-mono bg-primary/5 border border-primary/20 rounded px-1.5 py-0.5 pointer-events-none"
                                  title={`Will be used as {{firstName}} → ${firstName}`}
                                >
                                  → {firstName}
                                </span>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRecipient(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Helper hint */}
                    {content.includes("{{") && (
                      <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-primary/60" />
                        Your content uses personalization. Each recipient's <span className="text-foreground font-medium">Name</span> field will replace <span className="font-mono text-primary/80">{"{{firstName}}"}</span> in their email.
                      </p>
                    )}
                  </div>

                  <Button onClick={handleSend} disabled={sendEmailMutation.isPending} className="w-full">
                    {sendEmailMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" />Send Campaign</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ── History Tab ─────────────────────────────────────────────────── */}
            {activeTab === "history" && (
              <Card>
                <CardHeader>
                  <CardTitle>Campaign History</CardTitle>
                  <CardDescription>All email campaigns you've sent</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCampaigns ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : campaigns && campaigns.length > 0 ? (
                    <div className="space-y-2">
                      {campaigns.map((campaign) => (
                        <div
                          key={campaign.id}
                          className="flex items-center justify-between px-4 py-3 rounded-md border border-border hover:bg-accent/40 transition-colors"
                        >
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="text-sm font-medium truncate">{campaign.subject}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(campaign.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-xs text-muted-foreground text-right">
                              <span className="text-foreground font-medium">{campaign.sent_count}</span> sent
                              {campaign.failed_count > 0 && (
                                <span className="text-destructive ml-2">
                                  · {campaign.failed_count} failed
                                </span>
                              )}
                            </div>
                            {getStatusBadge(campaign.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No campaigns sent yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setActiveTab("compose")}
                      >
                        Create your first campaign
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Contacts Tab ────────────────────────────────────────────────── */}
            {activeTab === "contacts" && (
              <div className="space-y-6">
                {/* Add contact */}
                <Card>
                  <CardHeader>
                    <CardTitle>Add Contact</CardTitle>
                    <CardDescription>Save contacts to quickly populate campaign recipients</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <Input
                        placeholder="email@example.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addContact()}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Name (optional)"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addContact()}
                        className="flex-1"
                      />
                    </div>

                    {/* Tags chip input */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Tags <span className="text-muted-foreground font-normal">(press Enter or comma to add)</span>
                      </label>
                      <div className={cn(
                        "flex flex-wrap gap-1.5 min-h-[2.5rem] px-3 py-2 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-shadow",
                        newTags.length > 0 && "pb-1.5"
                      )}>
                        {newTags.map((tag) => (
                          <span key={tag} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", tagColorClass(tag))}>
                            {tag}
                            <button type="button" onClick={() => removeTagChip(tag)} className="hover:opacity-70">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                          placeholder={newTags.length === 0 ? "e.g. vip, newsletter, client…" : ""}
                          value={newTagInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.endsWith(",")) {
                              const tag = val.slice(0, -1).trim().toLowerCase();
                              if (tag && !newTags.includes(tag)) setNewTags([...newTags, tag]);
                              setNewTagInput("");
                            } else {
                              setNewTagInput(val);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); addTagChip(); }
                            if (e.key === "Backspace" && !newTagInput && newTags.length > 0)
                              removeTagChip(newTags[newTags.length - 1]);
                          }}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={addContact}
                      disabled={!newEmail.trim() || createContactMutation.isPending}
                      className="w-full"
                    >
                      {createContactMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Add Contact
                    </Button>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Bulk Import <span className="text-muted-foreground font-normal">(email, name, tag1|tag2)</span>
                      </label>
                      <Textarea
                        placeholder={"user@example.com\njohn@example.com,John Doe,vip|newsletter\njane@example.com,Jane,client"}
                        value={bulkContactImport}
                        onChange={(e) => setBulkContactImport(e.target.value)}
                        rows={3}
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={importBulkContacts}
                        disabled={!bulkContactImport.trim() || bulkImportMutation.isPending}
                        className="mt-2"
                      >
                        {bulkImportMutation.isPending && (
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        )}
                        Import Contacts
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact list */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Contacts <span className="text-muted-foreground font-normal text-base">({contacts.length})</span></CardTitle>
                        <CardDescription>Saved contacts for your campaigns</CardDescription>
                      </div>
                      {contacts.length > 0 && (
                        <Button onClick={useContactsInCampaign} size="sm">
                          <Send className="w-3.5 h-3.5 mr-1.5" />
                          Use in Campaign
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {contacts.length > 0 && (
                      <div className="space-y-3 mb-4">
                        <Input
                          placeholder="Search by name, email, or tag…"
                          value={contactSearch}
                          onChange={(e) => setContactSearch(e.target.value)}
                        />
                        {allTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => setActiveTagFilter(null)}
                              className={cn(
                                "px-2.5 py-0.5 rounded text-xs font-medium transition-colors",
                                activeTagFilter === null
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-accent"
                              )}
                            >
                              All
                            </button>
                            {allTags.map((tag) => (
                              <button
                                key={tag}
                                onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                                className={cn(
                                  "px-2.5 py-0.5 rounded text-xs font-medium transition-colors",
                                  activeTagFilter === tag
                                    ? "bg-primary text-primary-foreground"
                                    : cn(tagColorClass(tag), "hover:opacity-80")
                                )}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {loadingContacts ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin opacity-50" />
                        <p className="text-sm">Loading contacts...</p>
                      </div>
                    ) : contacts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No contacts yet</p>
                      </div>
                    ) : filteredContacts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No contacts match your search</p>
                    ) : (
                      <div className="space-y-1">
                        {filteredContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-start justify-between px-3 py-2.5 rounded-md hover:bg-accent/40 transition-colors group"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-xs font-display font-semibold text-primary">
                                  {(contact.name || contact.email)[0].toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                {contact.name && (
                                  <p className="text-sm font-medium truncate">{contact.name}</p>
                                )}
                                <p className={cn("text-xs truncate", contact.name ? "text-muted-foreground" : "text-sm text-foreground")}>
                                  {contact.email}
                                </p>
                                {contact.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {contact.tags.map((tag) => (
                                      <span key={tag} className={cn("px-1.5 py-px rounded text-[10px] font-medium", tagColorClass(tag))}>
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => removeContact(contact.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Contact Picker Dialog */}
      <Dialog open={contactPickerOpen} onOpenChange={setContactPickerOpen}>
        <DialogContent className="max-w-lg w-full flex flex-col gap-0 p-0 overflow-hidden max-h-[80vh]">
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <DialogTitle className="font-display text-base font-semibold">Select Contacts</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pickerSelected.size > 0
                ? `${pickerSelected.size} selected`
                : "Choose contacts to add as recipients"}
            </p>
          </DialogHeader>

          {/* Search + tag filter */}
          <div className="px-4 py-3 border-b border-border shrink-0 space-y-2">
            <Input
              placeholder="Search by name, email, or tag…"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              autoFocus
            />
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setPickerTagFilter(null)}
                  className={cn(
                    "px-2.5 py-0.5 rounded text-xs font-medium transition-colors",
                    pickerTagFilter === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  All
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setPickerTagFilter(pickerTagFilter === tag ? null : tag)}
                    className={cn(
                      "px-2.5 py-0.5 rounded text-xs font-medium transition-colors",
                      pickerTagFilter === tag
                        ? "bg-primary text-primary-foreground"
                        : cn(tagColorClass(tag), "hover:opacity-80")
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Select all row */}
          {pickerFiltered.length > 0 && (
            <div className="px-4 py-2 border-b border-border shrink-0 flex items-center justify-between">
              <button
                onClick={togglePickerAll}
                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  pickerSelected.size === pickerFiltered.length
                    ? "bg-primary border-primary"
                    : "border-border"
                )}>
                  {pickerSelected.size === pickerFiltered.length && (
                    <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                Select all ({pickerFiltered.length})
              </button>
            </div>
          )}

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto">
            {pickerFiltered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {pickerSearch ? "No contacts match your search" : "No contacts saved yet"}
              </div>
            ) : (
              <div className="py-1">
                {pickerFiltered.map((contact) => {
                  const selected = pickerSelected.has(contact.id);
                  return (
                    <button
                      key={contact.id}
                      onClick={() => togglePickerContact(contact.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors text-left",
                        selected && "bg-primary/5"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                        selected ? "bg-primary border-primary" : "border-border"
                      )}>
                        {selected && (
                          <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-display font-semibold text-primary">
                          {(contact.name || contact.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        {contact.name && (
                          <p className="text-sm font-medium truncate">{contact.name}</p>
                        )}
                        <p className={cn("truncate", contact.name ? "text-xs text-muted-foreground" : "text-sm")}>
                          {contact.email}
                        </p>
                        {contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {contact.tags.map((tag) => (
                              <span key={tag} className={cn("px-1.5 py-px rounded text-[10px] font-medium", tagColorClass(tag))}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border shrink-0 flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={() => setContactPickerOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={applyPickerSelection}
              disabled={pickerSelected.size === 0}
            >
              Add {pickerSelected.size > 0 ? `${pickerSelected.size} ` : ""}Selected
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl w-full h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <DialogTitle className="font-display text-base font-semibold">Email Preview</DialogTitle>
            {(() => {
              const firstRecipient = recipients.find((r) => r.email.trim());
              const previewName = firstRecipient?.name?.trim() || "there";
              const firstName = previewName.split(/\s+/)[0];
              const personalize = (text: string) =>
                text
                  .replace(/\{\{\s*name\s*\}\}/gi, previewName)
                  .replace(/\{\{\s*firstName\s*\}\}/gi, firstName)
                  .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
                  .replace(/\{\{\s*email\s*\}\}/gi, firstRecipient?.email || "you@example.com");
              return subject ? (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Subject: <span className="text-foreground">{personalize(subject)}</span>
                  {firstRecipient?.name && (
                    <span className="ml-2 text-[10px] text-primary/80">
                      (Previewing as: {firstRecipient.name})
                    </span>
                  )}
                </p>
              ) : null;
            })()}
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-white">
            {(() => {
              const firstRecipient = recipients.find((r) => r.email.trim());
              const previewName = firstRecipient?.name?.trim() || "there";
              const firstName = previewName.split(/\s+/)[0];
              const personalize = (text: string) =>
                text
                  .replace(/\{\{\s*name\s*\}\}/gi, previewName)
                  .replace(/\{\{\s*firstName\s*\}\}/gi, firstName)
                  .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
                  .replace(/\{\{\s*email\s*\}\}/gi, firstRecipient?.email || "you@example.com");

              const personalizedContent = content ? personalize(content) : "";

              return (
                <iframe
                  key={previewOpen ? "open" : "closed"}
                  title="Email Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                  srcDoc={
                    personalizedContent
                      ? personalizedContent.trimStart().startsWith("<")
                        ? personalizedContent
                        : (() => {
                            const normalized = personalizedContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
                            return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#333;line-height:1.7;">${
                              normalized
                                .split(/\n\n+/)
                                .map((p) => `<p style="margin:0 0 1em 0;">${p.replace(/\n/g, "<br>")}</p>`)
                                .join("")
                            }</div>`;
                          })()
                      : "<p style='color:#888;font-family:sans-serif;padding:2rem;font-size:14px'>No content to preview.</p>"
                  }
                />
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
