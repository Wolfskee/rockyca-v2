"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { adminListInquiries, getAdminInquiriesStreamUrl } from "@/lib/api";
import type { ContactInquiry } from "@/lib/types";

export type StreamConnectionState = "connecting" | "live" | "reconnecting";

export type InquiryRealtimeEvent =
  | {
      type: "inquiry.created";
      inquiry: ContactInquiry;
      unreadCount: number;
    }
  | {
      type: "inquiry.updated";
      inquiry: ContactInquiry;
      unreadCount: number;
    }
  | {
      type: "sync";
      unreadCount: number;
    };

interface AdminInquiriesContextValue {
  unreadCount: number;
  connectionState: StreamConnectionState;
  setUnreadCount: (count: number) => void;
  subscribe: (listener: (event: InquiryRealtimeEvent) => void) => () => void;
}

const AdminInquiriesContext = createContext<AdminInquiriesContextValue | null>(
  null,
);

export function AdminInquiriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionState, setConnectionState] =
    useState<StreamConnectionState>("connecting");

  const listenersRef = useRef(
    new Set<(event: InquiryRealtimeEvent) => void>(),
  );
  const hasConnectedOnceRef = useRef(false);

  const notifyListeners = useCallback((event: InquiryRealtimeEvent) => {
    for (const listener of listenersRef.current) {
      listener(event);
    }
  }, []);

  const subscribe = useCallback(
    (listener: (event: InquiryRealtimeEvent) => void) => {
      listenersRef.current.add(listener);
      return () => {
        listenersRef.current.delete(listener);
      };
    },
    [],
  );

  useEffect(() => {
    let active = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    adminListInquiries(1)
      .then((res) => {
        if (active) setUnreadCount(res.unreadCount);
      })
      .catch(() => {
        // SSE will sync once connected
      });

    const eventSource = new EventSource(getAdminInquiriesStreamUrl(), {
      withCredentials: true,
    });

    const startFallbackPoll = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        adminListInquiries(1)
          .then((res) => {
            if (!active) return;
            setUnreadCount(res.unreadCount);
            notifyListeners({ type: "sync", unreadCount: res.unreadCount });
          })
          .catch(() => {
            // Keep retrying silently
          });
      }, 10_000);
    };

    const stopFallbackPoll = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    eventSource.addEventListener("connected", (evt) => {
      if (!active) return;
      stopFallbackPoll();
      setConnectionState("live");
      try {
        const data = JSON.parse((evt as MessageEvent).data) as {
          unreadCount?: number;
        };
        if (typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
          if (hasConnectedOnceRef.current) {
            notifyListeners({ type: "sync", unreadCount: data.unreadCount });
          }
        }
      } catch {
        // ignore parse errors
      }
      hasConnectedOnceRef.current = true;
    });

    eventSource.addEventListener("heartbeat", () => {
      if (!active) return;
      setConnectionState("live");
      stopFallbackPoll();
    });

    eventSource.addEventListener("inquiry.created", (evt) => {
      if (!active) return;
      try {
        const data = JSON.parse((evt as MessageEvent).data) as {
          inquiry: ContactInquiry;
          unreadCount: number;
        };
        setUnreadCount(data.unreadCount);
        notifyListeners({
          type: "inquiry.created",
          inquiry: data.inquiry,
          unreadCount: data.unreadCount,
        });
      } catch {
        // ignore parse errors
      }
    });

    eventSource.addEventListener("inquiry.updated", (evt) => {
      if (!active) return;
      try {
        const data = JSON.parse((evt as MessageEvent).data) as {
          inquiry: ContactInquiry;
          unreadCount: number;
        };
        setUnreadCount(data.unreadCount);
        notifyListeners({
          type: "inquiry.updated",
          inquiry: data.inquiry,
          unreadCount: data.unreadCount,
        });
      } catch {
        // ignore parse errors
      }
    });

    eventSource.onerror = () => {
      if (!active) return;
      setConnectionState("reconnecting");
      startFallbackPoll();
    };

    const handleVisibility = () => {
      if (!document.hidden && eventSource.readyState !== EventSource.OPEN) {
        adminListInquiries(1)
          .then((res) => {
            if (!active) return;
            setUnreadCount(res.unreadCount);
            notifyListeners({ type: "sync", unreadCount: res.unreadCount });
          })
          .catch(() => {
            // ignore
          });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      stopFallbackPoll();
      document.removeEventListener("visibilitychange", handleVisibility);
      eventSource.close();
    };
  }, [notifyListeners]);

  return (
    <AdminInquiriesContext.Provider
      value={{
        unreadCount,
        connectionState,
        setUnreadCount,
        subscribe,
      }}
    >
      {children}
    </AdminInquiriesContext.Provider>
  );
}

export function useAdminInquiries() {
  const ctx = useContext(AdminInquiriesContext);
  if (!ctx) {
    throw new Error(
      "useAdminInquiries must be used inside AdminInquiriesProvider",
    );
  }
  return ctx;
}

