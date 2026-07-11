import { ArrowLeft, Hammer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SettingsCard } from './SettingsPrimitives';

/**
 * Shared placeholder used by all 8 Settings section pages. Each
 * section now renders <PageHeader> + <SettingsStub moduleName=…/>
 * so the sidebar nav still works, but the page body is intentionally
 * empty of interactive form content while the real configuration UI
 * ships in the next milestone.
 *
 * Stylistic rules followed:
 *   - Restrained, deliberate — not a "missing content" error screen.
 *   - No fake metrics, no glowing "Ready" badges, no AI-template tropes.
 *   - Single CTA: a quiet "Back to dashboard" link.
 */
export function SettingsStub({
  moduleName,
}: {
  moduleName: string;
}): JSX.Element {
  return (
    <SettingsCard title="Under Construction">
      <div className="flex flex-col items-center justify-center py-12 text-center max-w-sm mx-auto">
        <div className="w-12 h-12 rounded-xl bg-white/[0.04] text-muted-foreground ring-1 ring-white/[0.06] flex items-center justify-center mb-5 shadow-inner">
          <Hammer className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          {moduleName} configuration is being scoped.
        </p>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          This section is currently a stub for development. We&apos;ll ship
          the full configuration UI with the next milestone.
        </p>
        <div className="mt-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </SettingsCard>
  );
}
