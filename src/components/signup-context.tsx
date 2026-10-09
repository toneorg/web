"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { Placement } from "@/lib/forms";
import { type JoinedAt, parseSaved, signupStore } from "@/lib/signup-store";
import { ANCHOR, BRAND_PARAM } from "@/lib/site";

/** Who the signup section is talking to: someone who shops, or a brand. */
export type Audience = "pessoa" | "marca";

type Signup = {
  /** Empty until an e-mail joins the list from either field on the page. */
  email: string;
  /** Whether she already sent the optional answers of step two. */
  profileSaved: boolean;
  /** The field she joined from in this visit, so that spot can take focus; null after a reload. */
  joinedAt: JoinedAt;
  audience: Audience;
  join: (email: string, placement: Placement) => void;
  markProfileSaved: () => void;
  setAudience: (audience: Audience) => void;
};

const SignupContext = createContext<Signup | null>(null);

const noSubscription = () => () => {};

/** /marcas redirects to /?para=marca, so brand links open on the brand form. */
function audienceFromUrl(): Audience {
  const param = new URLSearchParams(window.location.search).get(BRAND_PARAM.key);
  return param === BRAND_PARAM.value ? "marca" : "pessoa";
}

/**
 * Shared by the two e-mail fields and the signup section, so joining in the
 * hero is already known when the person reaches the end of the page. What she
 * did is kept for the tab's lifetime, so a reload does not ask again.
 */
export function SignupProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(
    signupStore.subscribe,
    signupStore.snapshot,
    signupStore.serverSnapshot,
  );
  const saved = useMemo(() => parseSaved(raw), [raw]);

  const [joinedAt, setJoinedAt] = useState<JoinedAt>(null);
  const [chosen, setChosen] = useState<Audience | null>(null);
  const fromUrl = useSyncExternalStore<Audience>(noSubscription, audienceFromUrl, () => "pessoa");

  const join = useCallback((email: string, placement: Placement) => {
    setJoinedAt(placement);
    signupStore.save({ email, profileSaved: false });
  }, []);

  const markProfileSaved = useCallback(() => {
    signupStore.save({ ...parseSaved(signupStore.snapshot()), profileSaved: true });
  }, []);

  const value = useMemo(
    () => ({
      ...saved,
      joinedAt,
      audience: chosen ?? fromUrl,
      join,
      markProfileSaved,
      setAudience: setChosen,
    }),
    [saved, joinedAt, chosen, fromUrl, join, markProfileSaved],
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
    <a href={`#${ANCHOR.list}`} onClick={() => setAudience(audience)} className={className}>
      {children}
    </a>
  );
}
