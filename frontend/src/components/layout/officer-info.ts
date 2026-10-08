import { useAppSelector } from "@/store/hooks";
import {
  useGetTownshipsQuery,
  useGetWardVillagesQuery,
} from "@/services/api/censusApi";

/** Burmese titles for each login role, so the header reads like the field org. */
const ROLE_LABELS: Record<string, string> = {
  district: "ခရိုင်မှူး",
  township: "မြို့နယ်မှူး",
  village: "ကျေးရွာမှူး",
};

export interface OfficerInfo {
  /** Burmese role title, e.g. "မြို့နယ်မှူး". */
  roleLabel: string;
  /** Township / village name for the logged-in officer, when known. */
  locationName: string | null;
  /** "မြို့နယ်မှူး · မြစ်ဝကျွန်း" style label for compact spots. */
  label: string;
}

/**
 * Who is logged in: the Burmese role title plus the officer's own township or
 * village name (role-scoped endpoints return only the officer's own location,
 * so the list is one row and matched by code).
 */
export function useOfficerInfo(): OfficerInfo {
  const user = useAppSelector((state) => state.auth.user);
  const role = useAppSelector((state) => state.auth.role);

  const isTownship = role === "township";
  const isVillage = role === "village";
  const { data: townships } = useGetTownshipsQuery(undefined, { skip: !isTownship });
  const { data: wardVillages } = useGetWardVillagesQuery(undefined, {
    skip: !isVillage,
  });

  let locationName: string | null = null;
  if (isTownship && user?.tspCode) {
    locationName =
      townships?.find((township) => township.tspCode === user.tspCode)?.tspName ?? null;
  } else if (isVillage && user?.wvCode) {
    locationName =
      wardVillages?.find((village) => village.wvCode === user.wvCode)?.wvName ?? null;
  }

  const roleLabel = (role && ROLE_LABELS[role]) || role || "—";

  return {
    roleLabel,
    locationName,
    label: locationName ? `${roleLabel} · ${locationName}` : roleLabel,
  };
}
