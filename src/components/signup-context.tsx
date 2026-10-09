"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";

/** Who the signup section is talking to: someone who shops, or a brand. */
export type Audience = "pessoa" | "marca";

type Signup = {
  /** Empty until an e-mail joins the list from either field on the page. */
  email: string;
  audience: Audience;
  join: (email: string) => void;
  setAudience: (audience: Audience) => void;
};

const SignupContext = createContext<Signup | null>(null);

const noSubscription = () => () => {};

/** /marcas redirects to /?para=marca, so brand links open on the brand form. */
function audienceFromUrl(): Audience {
  return new URLSearchParams(window.location.search).get("para") === "marca" ? "marca" : "pessoa";
}

/**
 * Shared by the two e-mail fields and the signup section, so joining in the
 * hero is already known when the person reaches the end of the page.
 */
export function SignupProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState("");
  const [chosen, setChosen] = useState<Audience | null>(null);
  const fromUrl = useSyncExternalStore<Audience>(
    noSubscription,
    audienceFromUrl,
    () => "pessoa",
  );

  const value = useMemo(
    () => ({ email, audience: chosen ?? fromUrl, join: setEmail, setAudience: setChosen }),
    [email, chosen, fromUrl],
  );

  return <SignupContext value={value}>{children}</SignupContext>;
}

export function useSignup(): Signup {
  const signup = useContext(SignupContext);
  if (!signup) throw new Error("useSignup needs a SignupProvider above it");
  return signup;
}

/** A link to the signup section that also picks who it is for. */
export function SignupLink({
  audience,
  className,
  children,
}: {
  audience: Audience;
  className?: string;
  children: React.ReactNode;
}) {
  const { setAudience } = useSignup();
  return (
    <a href="#lista" onClick={() => setAudience(audience)} className={className}>
      {children}
    </a>
  );
}
