// src/app/admin/parkout/ambassadors/new/add-ambassador-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getLGAs } from "@/lib/nigeria-location";

type UserOption = { id: string; name: string | null; email: string };
type Props = { users: UserOption[]; states: string[] };

export default function AddAmbassadorForm({ users, states }: Props) {
  const router  = useRouter();
  const [userId,    setUserId]    = useState("");
  const [state,     setState]     = useState("");
  const [lga,       setLga]       = useState("");
  const [bankCode,  setBankCode]  = useState("");
  const [accNum,    setAccNum]    = useState("");
  const [accName,   setAccName]   = useState("");
  const [loading,   setLoading]   = useState(false);

  const lgaList = state ? getLGAs(state) : [];

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14,
    border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)",
    color: "var(--color-text)", outline: "none", boxSizing: "border-box",
    fontFamily: "var(--font-body)",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", display: "block", marginBottom: 6,
  };

  async function handleSubmit() {
    if (!userId)   { toast.error("Select a user.");       return; }
    if (!state)    { toast.error("Select a state.");      return; }
    if (!lga)      { toast.error("Select an LGA.");       return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/admin/parkout/ambassadors/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, territoryState: state, territoryLga: lga, bankCode, accountNumber: accNum, accountName: accName }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed. Try again."); return; }
      toast.success("Ambassador created ✓");
      router.push("/admin/parkout/ambassadors");
    } catch { toast.error("Network error. Try again."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ borderRadius: 14, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 12px" }}>Select user</p>
        <select value={userId} onChange={(e) => setUserId(e.target.value)} style={inputStyle}>
          <option value="">Search and select user</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name ?? u.email} — {u.email}</option>)}
        </select>
      </div>

      <div style={{ borderRadius: 14, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 12px" }}>Territory</p>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>State</label>
          <select value={state} onChange={(e) => { setState(e.target.value); setLga(""); }} style={inputStyle}>
            <option value="">Select state</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>LGA</label>
          <select value={lga} onChange={(e) => setLga(e.target.value)} disabled={!state} style={{ ...inputStyle, opacity: state ? 1 : 0.5 }}>
            <option value="">Select LGA</option>
            {lgaList.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div style={{ borderRadius: 14, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>Bank details <span style={{ fontWeight: 400, fontSize: 12, color: "var(--color-text-muted)" }}>(optional — add later)</span></p>
        <div style={{ marginBottom: 10, marginTop: 12 }}>
          <label style={labelStyle}>Bank code</label>
          <input value={bankCode} onChange={(e) => setBankCode(e.target.value)} placeholder="e.g. 058" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Account number</label>
          <input value={accNum} onChange={(e) => setAccNum(e.target.value)} placeholder="10-digit account number" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Account name</label>
          <input value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="Account holder name" style={inputStyle} />
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading}
        style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", backgroundColor: loading ? "var(--color-border)" : "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Creating…" : "Create Ambassador →"}
      </button>
    </div>
  );
}