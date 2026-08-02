import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { resendSignupEmail, getErrorMessage } from "@/lib/firebaseAuth";
import { MailCheck, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";

  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [resent, setResent] = useState(false);

  if (!email) {
    return (
      <AuthLayout icon={MailCheck} title="Missing email" subtitle="Please sign up again.">
        <Link to="/register" className="text-primary font-medium hover:underline text-sm">
          Back to sign up
        </Link>
      </AuthLayout>
    );
  }

  const handleResend = async () => {
    setError("");
    setSending(true);
    try {
      await resendSignupEmail(email);
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout
      icon={MailCheck}
      title="Check your email"
      subtitle={`We sent a confirmation link to ${email}`}
      footer={
        <>
          Wrong email?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Start over
          </Link>
        </>
      }
    >
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Click the link in that email to confirm your account — it’ll bring you right back here and take you to set up your business or shop.
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-left">
            {error}
          </div>
        )}
        {resent && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            Email resent — check your inbox (and spam folder).
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={sending}
          className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1.5 disabled:opacity-60"
        >
          {sending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Resend email
        </button>
      </div>
    </AuthLayout>
  );
}
