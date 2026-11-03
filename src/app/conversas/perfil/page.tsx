import { Profile } from "@/conversas/Profile";

export const metadata = { title: "Meu perfil", robots: { index: false, follow: false } };

export default function PerfilPage() {
  return <Profile />;
}
