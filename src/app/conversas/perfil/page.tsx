import { redirect } from "next/navigation";

// The profile is no longer a page (15/11/2026): the avatar opens it over the chat.
export default function PerfilPage() {
  redirect("/conversas?perfil=1");
}
