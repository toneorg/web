"use client";

import { ErrorScreen } from "@/components/error-screen";

export default function PaineisError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorScreen {...props} where="paineis" />;
}
