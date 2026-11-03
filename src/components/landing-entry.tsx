"use client";
// The way in from the home page. Someone already signed in gets one button to
// the app; anyone else gets the same sign-in (and invite) steps as /conversas.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/conversas/api";
import { SignIn } from "@/conversas/SignIn";
import { APP_PATH } from "@/lib/site";

export function LandingEntry() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "signed_in" | "signed_out">("checking");
  const [name, setName] = useState("");
  useEffect(() => {
    let live = true;
    api
      .me()
      .then((person) => {
        if (!live) return;
        setName(person.name.trim().split(/\s+/)[0] ?? "");
        setState("signed_in");
      })
      .catch(() => live && setState("signed_out"));
    return () => {
      live = false;
    };
  }, []);

  if (state === "checking")
    return (
      <p role="status" className="min-h-13 content-center text-small text-graphite">
        Um instante…
      </p>
    );
  if (state === "signed_in")
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink">{name ? `Que bom te ver, ${name}.` : "Você já entrou."}</p>
        <Link
          href={APP_PATH}
          className="press inline-flex min-h-13 items-center justify-center self-start rounded-full bg-ink px-7 text-ui text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Abrir a tone
        </Link>
      </div>
    );
  return <SignIn embedded onDone={() => router.push(APP_PATH)} />;
}
