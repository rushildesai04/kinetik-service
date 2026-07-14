"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReadinessRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/patient/metrics");
  }, [router]);
  return null;
}
