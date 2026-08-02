import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signUp, setMyRole, getErrorMessage } from "@/lib/firebaseAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, Eye, EyeOff, Store, ShoppingCart, ArrowRight } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

function RoleChooser({ onChoose }) {
  return (
    <AuthLayout
      icon={UserPlus}
      title="How will you use Amul Connect?"
      subtitle="Choose your account type — this can't be changed later"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
        </>
      }
    >
      <div className="grid gap-3">
        <button
          onClick={() => onChoose("supplier")}
          className="group text-left rounded-2xl border border-mist bg-surface p-5 hover:border-ink2/30 hover:shadow-lg transition-all"
        >
          <span className="w-11 h-11 rounded-xl bg-jet text-surface grid place-items-center"><Store size={20} /></span>
          <h3 className="mt-3 font-display font-semibold text-ink text-base">I’m a Supplier</h3>
          <p className="mt-1 text-sm text-ink2">Distribute to retailers · manage orders & billing</p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
            Sign up as a supplier <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>
        <button
          onClick={() => onChoose("customer")}
          className="group text-left rounded-2xl border border-mist bg-surface p-5 hover:border-ink2/30 hover:shadow-lg transition-all"
        >
          <span className="w-11 h-11 rounded-xl bg-jet text-surface grid place-items-center"><ShoppingCart size={20} /></span>
          <h3 className="mt-3 font-display font-semibold text-ink text-base">I’m a Retailer</h3>
          <p className="mt-1 text-sm text-ink2">Order from your distributor · track & pay bills</p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
            Sign up as a retailer <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>
      </div>
    </AuthLayout>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  // If a role wasn't already picked (e.g. landing page "I’m a Supplier"
  // button linking straight here with ?role=supplier), the very first
  // thing this page shows is the role chooser — before any email/password
  // fields. Once chosen, it's written to Firestore right after the account
  // is created and there's no UI anywhere to change it afterward.
  const [role, setRole] = useState(roleParam === "supplier" || roleParam === "customer" ? roleParam : null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!role) {
    return <RoleChooser onChoose={setRole} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { user } = await signUp(email, password);
      await setMyRole(user.uid, role); // locked in immediately — never asked again for this account
      navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed"));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title={role === "supplier" ? "Create your supplier account" : "Create your retailer account"}
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <button
        type="button"
        onClick={() => setRole(null)}
        className="mb-4 text-xs font-medium text-ink2 hover:text-ink underline"
      >
        ← Change account type
      </button>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12"
              required
              minLength={6}
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 pr-10 h-12"
              required
              minLength={6}
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
