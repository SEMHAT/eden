"use client";
import { useRouter } from "next/navigation";
import { setCompare } from "./compare-store";

export function ClearCompare() {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        setCompare([]);
        router.push("/boutique");
      }}
      className="text-sm font-semibold text-eden-green underline"
    >
      Vider la comparaison
    </button>
  );
}
