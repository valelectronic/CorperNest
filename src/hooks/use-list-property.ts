// src/hooks/use-list-property.ts
// Used by the nav "List a property" button / icon
// Centralises the routing decision so it stays consistent
// across top nav + bottom mobile nav.

import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface User {
  role?: string | null;
  agentVerified?: boolean | null;
}

export function useListProperty(user: User | null | undefined) {
  const router = useRouter();

  function handleListProperty() {
    if (!user) {
      // Not signed in
      router.push("/signin");
      return;
    }

    if (user.role !== "agent") {
      // Corper — prompt to switch role
      toast("Want to list a property?", {
        description: "Switch to an agent account to start listing.",
        action: {
          label: "Switch",
          onClick: () => router.push("/auth/role"),
        },
        duration: 5000,
      });
      return;
    }

    if (!user.agentVerified) {
      // Agent but not yet verified — go to KYC waiting page
      router.push("/agent/kyc");
      return;
    }

    // Verified agent — go to dashboard
    router.push("/agent");
  }

  return { handleListProperty };
}