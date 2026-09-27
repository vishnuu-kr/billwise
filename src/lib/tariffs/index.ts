import { TariffVersion } from '@/types';
import { CURRENT_KSEB_TARIFF_VERSION, PREVIOUS_KSEB_TARIFF_2023 } from './ksebTariff2024';

export interface TariffAuditRecord {
  id: string;
  tariffVersionId: string;
  timestamp: string;
  author: string;
  action: 'create' | 'update' | 'publish' | 'archive';
  changeSummary: string;
}

const INITIAL_TARIFF_VERSIONS: TariffVersion[] = [
  CURRENT_KSEB_TARIFF_VERSION,
  PREVIOUS_KSEB_TARIFF_2023,
];

const INITIAL_AUDIT_LOGS: TariffAuditRecord[] = [
  {
    id: 'audit-001',
    tariffVersionId: 'kseb-kserc-2024-v1',
    timestamp: '2024-11-01T00:00:00Z',
    author: 'Tariff Admin',
    action: 'publish',
    changeSummary: 'Published KSERC 2024 Domestic LT-1A Tariff schedule.',
  },
  {
    id: 'audit-002',
    tariffVersionId: 'kseb-kserc-2023-v2',
    timestamp: '2024-10-31T23:59:59Z',
    author: 'System',
    action: 'archive',
    changeSummary: 'Archived 2023 tariff schedule upon new order gazette.',
  },
];

class TariffRepository {
  private versions: Map<string, TariffVersion> = new Map();
  private auditLogs: TariffAuditRecord[] = [];

  constructor() {
    INITIAL_TARIFF_VERSIONS.forEach(v => this.versions.set(v.id, v));
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
  }

  getCurrentTariff(): TariffVersion {
    const current = Array.from(this.versions.values()).find(v => v.isCurrent);
    return current || CURRENT_KSEB_TARIFF_VERSION;
  }

  getTariffById(id: string): TariffVersion | undefined {
    return this.versions.get(id);
  }

  getAllVersions(): TariffVersion[] {
    return Array.from(this.versions.values()).sort(
      (a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
    );
  }

  getAuditLogs(): TariffAuditRecord[] {
    return [...this.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  saveVersion(version: TariffVersion, author: string = 'Admin'): void {
    const existing = this.versions.get(version.id);
    this.versions.set(version.id, version);

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      tariffVersionId: version.id,
      timestamp: new Date().toISOString(),
      author,
      action: existing ? 'update' : 'create',
      changeSummary: existing
        ? `Updated tariff rates/slabs for ${version.versionName}`
        : `Created new tariff draft: ${version.versionName}`,
    });
  }

  setPublished(versionId: string, author: string = 'Admin'): void {
    const target = this.versions.get(versionId);
    if (!target) return;

    // Unmark any previous current
    this.versions.forEach(v => {
      if (v.id !== versionId && v.isCurrent) {
        v.isCurrent = false;
        v.effectiveTo = new Date().toISOString().slice(0, 10);
      }
    });

    target.isCurrent = true;
    target.effectiveTo = null;

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      tariffVersionId: target.id,
      timestamp: new Date().toISOString(),
      author,
      action: 'publish',
      changeSummary: `Activated version ${target.versionName} as the primary active schedule.`,
    });
  }
}

export const tariffRepo = new TariffRepository();
