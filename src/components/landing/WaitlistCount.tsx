import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function WaitlistCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc("leads_count").then(({ data, error }) => {
      if (!cancelled && !error && typeof data === "number") {
        setCount(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!count || count < 1) return null;

  return (
    <p className="mt-4 text-xs text-muted-foreground">
      <span className="tabular font-semibold text-foreground">{count}</span>{" "}
      {count === 1 ? "chofer ya se anotó" : "choferes ya se anotaron"} a la lista de espera
    </p>
  );
}
