import { useState } from "react";
import { useNavigate } from "react-router";

import { DashboardButton } from "@/components/ui/DashboardButton.tsx";
import { DashboardInput } from "@/components/ui/DashboardControls.tsx";
import { useI18n } from "@/context/I18nContext.tsx";
import { AuthBackground } from "@/features/auth/AuthBackground.tsx";
import { useAuth } from "@/features/auth/AuthContext.tsx";
import { AuthLogo } from "@/features/auth/AuthLogo.tsx";

/**
 * First-run setup screen that creates the initial owner account.
 *
 * @returns Setup form page.
 */
export function SetupPage() {
  const { messages } = useI18n();
  const loginMessages = messages.auth.login;
  const setupMessages = messages.auth.setup;
  const { setup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    if (fd.get("password") !== fd.get("passwordConfirm")) {
      setError(setupMessages.passwordMismatch);
      setLoading(false);
      return;
    }

    try {
      await setup({
        login: String(fd.get("username") ?? ""),
        email: String(fd.get("email") ?? ""),
        displayName: String(fd.get("displayName") ?? ""),
        password: String(fd.get("password") ?? ""),
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : setupMessages.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthBackground>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <AuthLogo alt={messages.auth.logoAlt} />
        </div>

        <div className="bg-[var(--ds-surface)] rounded-[var(--radius-card)] shadow-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
          <div className="bg-[var(--ds-surface-inset)] border-b border-[var(--ds-border-subtle)] px-5 py-4">
            <h2 className="font-semibold text-[var(--ds-text)]">{setupMessages.title}</h2>
            <p className="text-sm text-[var(--ds-text-muted)] mt-1">{setupMessages.subtitle}</p>
          </div>

          <form id="setup-form" onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
            <DashboardInput
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              label={loginMessages.username}
            />

            <DashboardInput
              id="email"
              name="email"
              type="email"
              required
              label={setupMessages.email}
            />

            <DashboardInput
              id="displayName"
              name="displayName"
              type="text"
              required
              minLength={2}
              label={setupMessages.displayName}
            />

            <DashboardInput
              id="password"
              name="password"
              type="password"
              required
              minLength={10}
              label={loginMessages.password}
            />

            <DashboardInput
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              required
              label={setupMessages.confirmPassword}
            />

            {error && (
              <p role="alert" className="text-red-500 text-sm">
                {error}
              </p>
            )}
          </form>

          <div className="bg-[var(--ds-surface-inset)] border-t border-[var(--ds-border-subtle)] px-5 py-4 flex justify-end">
            <DashboardButton
              type="submit"
              form="setup-form"
              disabled={loading}
              size="large"
              variant="primary"
            >
              {loading ? setupMessages.submitLoading : setupMessages.submit}
            </DashboardButton>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
