"use client";
// Liste de comparaison : par appareil, conservée dans le navigateur (4 produits maximum).
import { useSyncExternalStore } from "react";

const KEY = "eden_compare";
const EVENT = "eden-compare";
export const MAX_COMPARE = 4;

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}
let cache: string[] = [];
let cacheRaw = "";
function snapshot() {
  let raw = "[]";
  try {
    raw = localStorage.getItem(KEY) ?? "[]";
  } catch {}
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = read();
  }
  return cache;
}
const empty: string[] = [];

export function setCompare(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX_COMPARE)));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function toggleCompare(id: string) {
  const cur = read();
  if (cur.includes(id)) setCompare(cur.filter((x) => x !== id));
  else if (cur.length < MAX_COMPARE) setCompare([...cur, id]);
  else return false;
  return true;
}

export function useCompare() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(EVENT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    snapshot,
    () => empty,
  );
}
