import { useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

type Message = { role: "user" | "assistant"; text: string };

export function FaqChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post<{ answer: string }>("/ai/faq-chat", { message: userMessage });
      setMessages((prev) => [...prev, { role: "assistant", text: res.answer }]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de la réponse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="mb-3 flex h-96 w-80 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="size-4" />
              Aide Smart Stage
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer l'assistant"
              className="rounded-md p-1 hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 ? (
              <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                Posez-moi une question sur l'utilisation de Smart Stage — par exemple « Comment
                ajouter une entrée de journal ? » ou « Où voir mes tâches en retard ? »
              </p>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              ))
            )}
            {loading ? <p className="text-xs text-muted-foreground">…</p> : null}
          </div>

          <div className="flex items-center gap-2 border-t border-border p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              placeholder="Votre question…"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={loading}
              aria-label="Envoyer"
              className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-60"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant d'aide"}
        className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated transition-transform hover:scale-105"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}