"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { INTERVIEW_COLUMNS, INTERVIEW_COPY } from "@/config ori/interview";
import { LIVESTOCK_COPY } from "@/config ori/livestock";
import {
  AGE_CLASS_LABELS,
  SIZE_CLASS_LABELS,
} from "@/config ori/restriction";
import { cn } from "@/lib/cn";
import { getMainCategories } from "@/lib/repositories/category";
import {
  AGE_LIMIT_CODE,
  type ApiAnimal,
  type ApiSurveyDetail,
  type UpdateSurveyPayload,
} from "@/lib/repositories/livestock";
import type { Category, InterviewInfo } from "@/types/census";
import type { InterviewColumnKey } from "@/types/interview";

export interface InterviewEditFormProps {
  interview: InterviewInfo;
  detail: ApiSurveyDetail;
  categories: Category[];
  isSaving: boolean;
  /** Server-side failure from the last save attempt, shown above the buttons. */
  error: string | null;
  onSave: (payload: UpdateSurveyPayload) => void;
  onCancel: () => void;
}

/** One row of an animal group while it is being edited. */
interface AnimalRow {
  /** Position within the group's category list — the survey's own numbering. */
  categoryId: number;
  ageLimit?: string;
  sex: string;
  /** Kept as text so the field can be emptied while typing. */
  count: string;
}

interface GroupConfig {
  mcat: string;
  field: "bigAnimals" | "smallAnimals" | "poultry" | "breedingAnimals";
  /** Raw `ageLimit` values in backend order; `null` when age is not recorded. */
  ages: readonly string[] | null;
  sexes: readonly string[];
}

const GROUPS: readonly [GroupConfig, GroupConfig, GroupConfig, GroupConfig] = [
  {
    mcat: "MC1",
    field: "bigAnimals",
    ages: ["LessThanOne", "Between1and3", "Over3"],
    sexes: ["male", "ca_male", "female"],
  },
  {
    mcat: "MC2",
    field: "smallAnimals",
    ages: ["Under2months", "Between2and6months", "Over6months"],
    sexes: ["male", "ca_male", "female"],
  },
  {
    mcat: "MC3",
    field: "poultry",
    ages: ["Young", "Middle", "Old"],
    sexes: ["male", "female"],
  },
  {
    mcat: "MC4",
    field: "breedingAnimals",
    ages: null,
    sexes: ["male", "female"],
  },
];

const SEX_LABELS: Record<string, string> = {
  male: "အထီး",
  ca_male: "သင်းကွပ်ထီး",
  female: "အမ",
};

/** Raw `ageLimit` → `CODE — ဘာသာပြန်`, the wording the detail view uses. */
function ageLabel(raw: string): string {
  const code = AGE_LIMIT_CODE[raw];
  if (!code) return raw;
  const label =
    AGE_CLASS_LABELS[code as keyof typeof AGE_CLASS_LABELS] ??
    SIZE_CLASS_LABELS[code as keyof typeof SIZE_CLASS_LABELS];
  return label ? `${code} — ${label}` : code;
}

function toFormRows(rows: readonly ApiAnimal[] | undefined, config: GroupConfig): AnimalRow[] {
  return (rows ?? []).map((row) => {
    const sex = config.sexes.includes(row.sex)
      ? row.sex
      : row.sex === "ca_female"
        ? "female"
        : (config.sexes[0] ?? "male");
    const ageLimit =
      config.ages && row.ageLimit && config.ages.includes(row.ageLimit)
        ? row.ageLimit
        : (config.ages?.[0] ?? undefined);
    return { categoryId: row.categoryId, ageLimit, sex, count: String(row.count) };
  });
}

interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/** The interview columns as editable strings (`h_age` kept as text while typing). */
type InterviewFields = Record<InterviewColumnKey, string>;

function Field({ label, children, className }: FieldProps) {
  return (
    <label className={cn("flex flex-col gap-1 text-xs font-medium text-muted-foreground", className)}>
      <span className="truncate">{label}</span>
      {children}
    </label>
  );
}

/**
 * Edit form for one survey: the interview fields above, the four animal groups
 * below, and one Save that sends the whole record back through `PUT /surveys`.
 *
 * The rows start from the raw survey detail rather than the resolved view, so
 * what is submitted is exactly the shape the validator expects — the display
 * mapping never round-trips through the form.
 */
export function InterviewEditForm({
  interview,
  detail,
  categories,
  isSaving,
  error,
  onSave,
  onCancel,
}: InterviewEditFormProps) {
  const [fields, setFields] = useState<InterviewFields>(() => ({
    h_name: interview.h_name,
    h_edu: interview.h_edu,
    h_gender: interview.h_gender,
    h_phone: interview.h_phone,
    h_age: String(interview.h_age),
    ans_date: interview.ans_date,
  }));
  const [rows, setRows] = useState<Record<GroupConfig["field"], AnimalRow[]>>(() => ({
    bigAnimals: toFormRows(detail.bigAnimals, GROUPS[0]),
    smallAnimals: toFormRows(detail.smallAnimals, GROUPS[1]),
    poultry: toFormRows(detail.poultry, GROUPS[2]),
    breedingAnimals: toFormRows(detail.breedingAnimals, GROUPS[3]),
  }));
  const [formError, setFormError] = useState<string | null>(null);

  const categoryOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string }[]>();
    for (const group of GROUPS) {
      const list = categories.filter((category) => category.mcat_id === group.mcat);
      options.set(
        group.mcat,
        list.map((category, index) => ({
          value: String(index + 1),
          label: `${category.cat_name} (${category.cat_id})`,
        })),
      );
    }
    return options;
  }, [categories]);

  const mainCategoryNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const main of getMainCategories()) {
      names.set(main.mcat_id, main.name);
    }
    return names;
  }, []);

  function setField(column: InterviewColumnKey, value: string) {
    setFields((previous) => ({ ...previous, [column]: value }));
  }

  function updateRow(field: GroupConfig["field"], index: number, patch: Partial<AnimalRow>) {
    setRows((previous) => ({
      ...previous,
      [field]: previous[field].map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    }));
  }

  function addRow(config: GroupConfig) {
    setRows((previous) => ({
      ...previous,
      [config.field]: [
        ...previous[config.field],
        { categoryId: 1, ageLimit: config.ages?.[0], sex: "male", count: "0" },
      ],
    }));
  }

  function removeRow(field: GroupConfig["field"], index: number) {
    setRows((previous) => ({
      ...previous,
      [field]: previous[field].filter((_, rowIndex) => rowIndex !== index),
    }));
  }

  function validate(): string | null {
    const copy = INTERVIEW_COPY.formErrors;
    if (!fields.h_name.trim() || !fields.h_edu.trim() || !fields.h_gender.trim()) {
      return copy.required;
    }
    if (!/^[0-9+\-() ]{5,20}$/.test(fields.h_phone.trim())) {
      return copy.phone;
    }
    const age = Number(fields.h_age);
    if (fields.h_age.trim() === "" || !Number.isInteger(age) || age < 0 || age > 150) {
      return copy.age;
    }
    if (!fields.ans_date) {
      return copy.date;
    }
    for (const group of GROUPS) {
      for (const row of rows[group.field]) {
        const count = Number(row.count);
        if (
          row.count.trim() === "" ||
          !Number.isInteger(count) ||
          count < 0 ||
          count > 99999
        ) {
          return copy.count;
        }
      }
    }
    return null;
  }

  function toApiRows(list: AnimalRow[], withAge: boolean): ApiAnimal[] {
    return list.map((row) => ({
      categoryId: row.categoryId,
      ...(withAge ? { ageLimit: row.ageLimit ?? "" } : {}),
      sex: row.sex,
      count: Number(row.count),
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    setFormError(null);
    onSave({
      hName: fields.h_name.trim(),
      hEdu: fields.h_edu.trim(),
      hGender: fields.h_gender.trim(),
      hPhone: fields.h_phone.trim(),
      hAge: Number(fields.h_age),
      ansDate: fields.ans_date,
      bigAnimals: toApiRows(rows.bigAnimals, true),
      smallAnimals: toApiRows(rows.smallAnimals, true),
      poultry: toApiRows(rows.poultry, true),
      breedingAnimals: toApiRows(rows.breedingAnimals, false),
    });
  }

  const banner = formError ?? error;

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold tracking-tight">
          {INTERVIEW_COPY.editSectionInterview}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {INTERVIEW_COLUMNS.map((column) => (
            <Field
              key={column.column}
              label={column.label}
              className={column.column === "ans_date" ? "sm:col-span-2" : undefined}
            >
              <Input
                type={
                  column.column === "ans_date"
                    ? "date"
                    : column.column === "h_age"
                      ? "number"
                      : column.column === "h_phone"
                        ? "tel"
                        : "text"
                }
                value={fields[column.column] ?? ""}
                min={column.column === "h_age" ? 0 : undefined}
                max={column.column === "h_age" ? 150 : undefined}
                onChange={(event) => setField(column.column, event.target.value)}
              />
            </Field>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold tracking-tight">
          {INTERVIEW_COPY.editSectionLivestock}
        </h3>

        {GROUPS.map((group) => (
          <div key={group.field} className="rounded-lg border border-border">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
              <div className="flex min-w-0 items-baseline gap-2">
                <h4 className="truncate text-sm font-semibold">
                  {mainCategoryNames.get(group.mcat)}
                </h4>
                <span className="font-mono text-xs text-muted-foreground">{group.mcat}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addRow(group)}
              >
                {INTERVIEW_COPY.addRow}
              </Button>
            </div>

            {rows[group.field].length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">
                {INTERVIEW_COPY.groupEmpty}
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {rows[group.field].map((row, index) => (
                  <div
                    key={`${group.field}-${index}`}
                    className="flex flex-wrap items-end gap-2 px-3 py-2"
                  >
                    <Field
                      label={LIVESTOCK_COPY.columnLabels.animal}
                      className="min-w-40 flex-1"
                    >
                      <Select
                        value={String(row.categoryId)}
                        onChange={(event) =>
                          updateRow(group.field, index, {
                            categoryId: Number(event.target.value),
                          })
                        }
                      >
                        {(categoryOptions.get(group.mcat) ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    {group.ages ? (
                      <Field label={LIVESTOCK_COPY.columnLabels.age} className="w-48">
                        <Select
                          value={row.ageLimit ?? ""}
                          onChange={(event) =>
                            updateRow(group.field, index, { ageLimit: event.target.value })
                          }
                        >
                          {group.ages.map((age) => (
                            <option key={age} value={age}>
                              {ageLabel(age)}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    ) : null}

                    <Field label={LIVESTOCK_COPY.columnLabels.sex} className="w-36">
                      <Select
                        value={row.sex}
                        onChange={(event) =>
                          updateRow(group.field, index, { sex: event.target.value })
                        }
                      >
                        {group.sexes.map((sex) => (
                          <option key={sex} value={sex}>
                            {SEX_LABELS[sex] ?? sex}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field label={LIVESTOCK_COPY.columnLabels.count} className="w-24">
                      <Input
                        type="number"
                        min={0}
                        max={99999}
                        value={row.count}
                        onChange={(event) =>
                          updateRow(group.field, index, { count: event.target.value })
                        }
                      />
                    </Field>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`${INTERVIEW_COPY.removeRow} ${mainCategoryNames.get(group.mcat)} ${index + 1}`}
                      onClick={() => removeRow(group.field, index)}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {banner ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {banner}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          {INTERVIEW_COPY.cancelEdit}
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? INTERVIEW_COPY.savingButton : INTERVIEW_COPY.saveButton}
        </Button>
      </div>
    </form>
  );
}
