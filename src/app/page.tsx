"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Center, Loader } from "@mantine/core";

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    switch (user.role) {
      case "PROPONENT":
        router.push("/proponent/dashboard");
        break;
      case "CID_CHIEF":
      case "ASDS":
      case "SDS":
      case "ADMIN":
        router.push("/dashboard/management");
        break;
      default:
        router.push("/reviewer/queue");
    }
  }, [user, router]);

  return <Center h={400}><Loader /></Center>;
}
