"use client";

import { useEffect, useState } from "react";
import { ChevronRight, FileText, Landmark, MapPin, PawPrint, UserRound } from "lucide-react";

import { DetailList } from "@/components/shared/detail-list";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  APP_NAME,
  COUNTRY_NAME,
  CURRENT_PHASE,
  CURRENT_PHASE_LABEL,
  DATA_SOURCE_LABEL,
  DISTRICT_NAME,
  DISTRICT_NAME_MM,
  GEOGRAPHY_CHAIN,
} from "@/config/app";
import { getInterviews } from "@/lib/repositories/interview";
import { getTownVillages } from "@/lib/repositories/town-village";
import { getTownships } from "@/lib/repositories/township";
import { getWardVillages } from "@/lib/repositories/ward-village";
import type { DetailItem } from "@/types/ui";

const TOKEN_SWATCHES = [
  { name: "primary", className: "bg-primary" },
  { name: "secondary", className: "bg-secondary" },
  { name: "muted", className: "bg-muted" },
  { name: "accent", className: "bg-accent" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "info", className: "bg-info" },
  { name: "destructive", className: "bg-destructive" },
] as const;

const API_SOURCES = [
  { table: "locations", endpoint: "/locations/townships", role: "Township", records: 0 },
  { table: "town_vg", endpoint: "/locations/townvgs", role: "Town / Village Tract", records: 0 },
  { table: "ward_village", endpoint: "/locations/wardvillages", role: "Ward / Village", records: 0 },
  { table: "categories", endpoint: "/categories/:type", role: "Animal type", records: 0 },
  { table: "surveys", endpoint: "/surveys", role: "Household interview", records: 0 },
  { table: "reports", endpoint: "/reports/district", role: "Aggregated statistics", records: 0 },
];

export function HomeContent() {
  const [townships, setTownships] = useState<number | null>(null);
  const [townVillages, setTownVillages] = useState<number | null>(null);
  const [wardVillages, setWardVillages] = useState<number | null>(null);
  const [interviews, setInterviews] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getTownships(), getTownVillages(), getWardVillages(), getInterviews()])
      .then(([t, tv, wv, iv]) => {
        setTownships(t.length);
        setTownVillages(tv.length);
        setWardVillages(wv.length);
        setInterviews(iv.length);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const scopeDetails: DetailItem[] = [
    { label: "District", value: `${DISTRICT_NAME} (${DISTRICT_NAME_MM})` },
    { label: "Country", value: COUNTRY_NAME },
    { label: "Townships in scope", value: townships ?? "—" },
    { label: "Data source", value: DATA_SOURCE_LABEL },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={APP_NAME}
        subtitle={DISTRICT_NAME}
        description={`${CURRENT_PHASE} — ${CURRENT_PHASE_LABEL}. The Data Explorer is live at /explorer; household, livestock and reporting screens build on the same tokens, primitives and data layer.`}
      />

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Townships"
          labelMm="မြို့နယ်"
          value={townships ?? "—"}
          icon={Landmark}
        />
        <StatCard
          label="Town / Village Tracts"
          labelMm="မြို့ / ရွာတိုင်း"
          value={townVillages ?? "—"}
          icon={MapPin}
        />
        <StatCard
          label="Wards / Villages"
          labelMm="ရပ်ကွက် / ရွာ"
          value={wardVillages ?? "—"}
          icon={FileText}
        />
        <StatCard
          label="Household interviews"
          labelMm="အိမ်ထောင်စု မေးမြးမှု"
          value={interviews ?? "—"}
          icon={UserRound}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Scope</CardTitle>
            <CardDescription>
              Census data hierarchy covered by this system.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <DetailList items={scopeDetails} orientation="inline" />

            <ol className="flex flex-col gap-1">
              {GEOGRAPHY_CHAIN.map((level, index) => (
                <li key={level} className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
                    {index + 1}
                  </span>
                  <span className="text-sm">{level}</span>
                  {index < GEOGRAPHY_CHAIN.length - 1 ? (
                    <ChevronRight
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>API endpoints</CardTitle>
            <CardDescription>
              Backend REST API providing live census data.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Represents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {API_SOURCES.map((source) => (
                  <TableRow key={source.table}>
                    <TableCell className="font-medium">{source.table}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {source.endpoint}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {source.role}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Design tokens</CardTitle>
            <CardDescription>
              Semantic colours defined once in{" "}
              <code className="font-mono">src/app/globals.css</code>. Components
              never reference raw hex values.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TOKEN_SWATCHES.map((token) => (
                <li key={token.name} className="flex items-center gap-2">
                  <span
                    className={`size-6 shrink-0 rounded-md border border-border ${token.className}`}
                    aria-hidden
                  />
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {token.name}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Primitives</CardTitle>
            <CardDescription>
              Reusable building blocks every feature screen composes from.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="grid grid-cols-2 gap-2 font-mono text-xs text-muted-foreground sm:grid-cols-3">
              {[
                "badge",
                "breadcrumb",
                "button",
                "card",
                "input",
                "label",
                "select",
                "separator",
                "skeleton",
                "spinner",
                "table",
                "textarea",
              ].map((primitive) => (
                <li key={primitive} className="truncate">
                  {primitive}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" size="sm">
                Primary
              </Button>
              <Button variant="secondary" size="sm">
                Secondary
              </Button>
              <Button variant="outline" size="sm">
                Outline
              </Button>
              <Button variant="ghost" size="sm">
                Ghost
              </Button>
              <Button variant="destructive" size="sm">
                Destructive
              </Button>
              <Button size="icon" variant="outline" aria-label="Disabled example" disabled>
                <PawPrint aria-hidden />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
