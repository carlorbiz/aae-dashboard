import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { Streamdown } from "streamdown";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
};

export default function AIChat() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isLoading: suggestionsLoading } = trpc.chat.getSuggestedQuestions.useQuery(undefined, {
    enabled: !!user,
  });

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.message,
        timestamp: data.timestamp,
      }]);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || sendMessage.isPending) return;

    const userMessage: Message = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Send to API
    await sendMessage.mutateAsync({
      message: inputValue,
      conversationHistory: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  if (authLoading) {
    return <DashboardLayout><div className="p-6"><Skeleton className="h-96 w-full" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Ask questions about your AAE or request insights
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="p-4 rounded-full bg-primary/10">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">How can I help you today?</h2>
                <p className="text-muted-foreground max-w-md">
                  I can help you understand your dashboard data, analyze trends, and provide insights about your AI Automation Ecosystem.
                </p>
              </div>

              {/* Suggested Questions */}
              {!suggestionsLoading && suggestions && suggestions.length > 0 && (
                <div className="w-full max-w-2xl space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Suggested questions:</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start text-left h-auto py-3 px-4"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">{suggestion}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <Streamdown>{message.content}</Streamdown>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t bg-background">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything about your AAE..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={sendMessage.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || sendMessage.isPending}
              size="icon"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
