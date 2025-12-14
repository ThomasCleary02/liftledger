"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function WorkoutsRedirect() {
  const router = useRouter();

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    router.replace(`/day/${today}`);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
        <p className="mt-4 text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
}
