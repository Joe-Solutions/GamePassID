"use client";

import { useState, useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";

function useRegisterUrl() {
  return useSyncExternalStore(
    () => () => {},
    () => `${window.location.origin}/register`,
    () => "",
  );
}

export function RegistrationQrShare() {
  const registerUrl = useRegisterUrl();
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!registerUrl) return;
    try {
      await navigator.clipboard.writeText(registerUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  async function shareLink() {
    if (!registerUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Registration Hub",
          text: "Register as a licensed player",
          url: registerUrl,
        });
        return;
      } catch {
        // Fall through to copy if share is cancelled or unavailable.
      }
    }
    await copyLink();
  }

  return (
    <div className="panel fade-up mx-auto max-w-2xl p-6 sm:p-8">
      <div className="max-w-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Share with players
        </p>
        <h2 className="display mt-2 text-3xl font-bold">
          QR code registration link
        </h2>
        <p className="mt-2 text-[var(--fg-muted)]">
          Players can scan this QR code on their phone to open self-registration
          and create their own license — no encoder needed at the desk.
        </p>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="mx-auto w-fit rounded-2xl border border-[var(--line-strong)] bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
          {registerUrl ? (
            <QRCodeSVG
              value={registerUrl}
              size={220}
              level="M"
              marginSize={1}
              bgColor="#ffffff"
              fgColor="#04261c"
            />
          ) : (
            <div className="grid h-[220px] w-[220px] place-items-center text-sm text-[var(--fg-muted)]">
              Loading…
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
              Registration link
            </p>
            <p className="mt-2 break-all font-mono text-sm text-[var(--accent)]">
              {registerUrl || "…"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={copyLink}>
              {copied ? "Copied" : "Copy link"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={shareLink}>
              Share link
            </button>
            <a
              href={registerUrl || "/register"}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
            >
              Open registration
            </a>
          </div>

          <p className="text-sm text-[var(--fg-muted)]">
            Tip: display this QR on a screen or print it at the venue so players
            can register from their phones while waiting.
          </p>
        </div>
      </div>
    </div>
  );
}
