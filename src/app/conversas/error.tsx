"use client";

import { ErrorScreen } from "@/components/error-screen";

export default function ConversasError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorScreen {...props} where="conversas" />;
}
