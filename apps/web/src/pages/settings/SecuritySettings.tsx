import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser, useSession, useSessionList } from '@clerk/clerk-react';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Download,
  FileLock2,
  HardDriveDownload,
  KeyRound,
  Loader2,
  ScrollText,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import type { JSX } from 'react';

import { PageHeader } from '../../components/layout/PageHeader';
import { FieldRow, SettingsCard, Toggle } from '../../components/settings/SettingsPrimitives';
import { useAuthedFetch } from '../../hooks/useAuthedFetch';
import { downloadBusinessExport } from '../../lib/api-security';
import type { ApiError as ApiErrorT } from '../../lib/api-business';

export default function SecuritySettings(): JSX.Element {
  const { isLoaded, isSignedIn } = useUser();
  const { session } = useSession();
  // Clerk's useSessionList returns `{ sessions, isLoading, ... }` — not
  // `{ data, isLoading }`. Alias the field we actually use.
  const { sessions: sessionList } = useSessionList();
  // The export endpoint is auth-gated (see apps/api/src/routes/security.ts).
  // We keep `useAuthedFetch` here so signed-in callers go through the
  // standard bearer-token path, and the export button is hidden for
  // signed-out visitors (see the conditional below).
  const fetch = useAuthedFetch();

  const [twoFactor, setTwoFactor] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastExportName, setLastExportName] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  async function runExport() {
    if (exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const name = await fetch(async (token) => downloadBusinessExport(token));
      setLastExportName(name);
    } catch (err) {
      const e = err as unknown as ApiErrorT | null;
      setExportError(e?.message ?? String(err));
    } finally {
      setExporting(false);
    }
  }

  const sessionCount = sessionList?.length ?? 0;
  const currentSessionId = session?.id ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings · Security"
        title="Security"
        subtitle="Two-factor authentication, active sessions, audit trail, and full data export."
      />

      <SettingsCard
        title="Two-factor authentication"
        description="Add a second factor to your sign-in. Strongly recommended for OWNER and ADMIN roles."
      >
        <FieldRow
          label="Require 2FA on next sign-in"
          description="Routes your existing login through an authenticator app challenge."
        >
          <Toggle
            checked={twoFactor}
            onChange={(v) => setTwoFactor(v)}
            label={twoFactor ? 'Enabled' : 'Disabled'}
          />
        </FieldRow>
        {!twoFactor && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-md bg-warning/10 border border-warning/30 p-3 text-sm text-warning"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              If your business is the only thing between your customers and a
              missed call, turn this on. It takes about 30 seconds.
            </p>
          </div>
        )}
      </SettingsCard>

      <SettingsCard
        title="Active sessions"
        description="Devices currently authenticated to this account."
      >
        <div className="flex items-center gap-3 text-sm">
          <span className="w-9 h-9 rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-4 h-4" />
          </span>
          <p>
            <span className="text-foreground font-semibold tabular-nums">
              {sessionCount}
            </span>{' '}
            active session{sessionCount === 1 ? '' : 's'} for this business.
            {currentSessionId && (
              <span className="text-xs text-muted-foreground ml-2">
                Current session id: <code className="font-mono">{currentSessionId.slice(0, 12)}…</code>
              </span>
            )}
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          Clerk will surface the full per-device list (browser, OS,
          last-active). Sign any device out from there.
        </p>
      </SettingsCard>

      <SettingsCard
        title="Audit logs"
        description="Every business action — logins, logouts, settings changes, jobs created."
      >
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30 flex items-center justify-center flex-shrink-0">
            <ScrollText className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm text-foreground font-medium">
              Activity timeline coming next milestone.
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              We&apos;ll surface every login, settings change, and worker update
              here as a scrollable, filterable ledger. Audit-lite already on
              the road map.
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Data export"
        description="Download your business data as a single JSON file. Includes workers, customers, jobs, calls and appointments — useful for backups or migrating."
      >
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-lg bg-success/15 text-success ring-1 ring-success/30 flex items-center justify-center flex-shrink-0">
            <HardDriveDownload className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              The export reflects your data at the moment of download.
              Re-download anytime — the file stays consistent across days.
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Authentication is required (you&apos;re signed in).
              </li>
              <li className="flex items-center gap-1.5">
                <FileLock2 className="w-3 h-3" />
                PII stripped from call transcripts (phone numbers retained).
              </li>
              <li className="flex items-center gap-1.5">
                <Cloud className="w-3 h-3" />
                Filename embeds your business id and the export date.
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs text-muted-foreground">
            {lastExportName && (
              <span className="inline-flex items-center gap-1 text-success font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Downloaded <code className="font-mono">{lastExportName}</code>
              </span>
            )}
            {exportError && (
              <span className="inline-flex items-center gap-1 text-danger">
                <AlertTriangle className="w-3.5 h-3.5" />
                {exportError}
              </span>
            )}
          </div>
          {isSignedIn === false ? (
            <Link
              to="/waitlist"
              className="btn-organic inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm shadow-primary/30"
            >
              <Download className="w-4 h-4" />
              Sign in to export your data
            </Link>
          ) : (
            <button
              type="button"
              onClick={runExport}
              disabled={!isLoaded || exporting}
              className="btn-organic inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Preparing…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export data
                </>
              )}
            </button>
          )}
        </div>
      </SettingsCard>

      <p className="text-xs text-muted-foreground/70 leading-relaxed">
        <KeyRound className="w-3 h-3 inline -mt-0.5 mr-1" />
        API keys are not yet exposed — they will live under a dedicated tab once
        the developer surface area lands.
      </p>
    </div>
  );
}
