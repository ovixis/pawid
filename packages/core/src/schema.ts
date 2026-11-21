import { z } from "zod";

/**
 * Data model for a dog profile.
 * Field names follow the sections of the EU pet passport (model in Implementing
 * Regulation (EU) 2026/705). TODO: map every field 1:1 once the annex is reviewed.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

/** ISO 11784/11785 microchip: 15 digits. */
export const microchipSchema = z.string().regex(/^\d{15}$/, "microchip must be 15 digits");

export const vaccinationSchema = z.object({
  kind: z.enum(["rabies", "other"]),
  /** Name or batch info as written in the passport. Free text. */
  product: z.string().max(200).optional(),
  administeredOn: isoDate,
  validFrom: isoDate.optional(),
  validUntil: isoDate,
  /** Vet who signed the entry. Filled by the vet signing module (not built yet). */
  signedBy: z.string().max(200).optional(),
});

export const treatmentSchema = z.object({
  kind: z.enum(["echinococcus", "other"]),
  administeredOn: isoDate,
  /** Some countries require the treatment within a time window before entry. */
  note: z.string().max(200).optional(),
});

export const dogSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  microchip: microchipSchema,
  birthDate: isoDate.optional(),
  breed: z.string().max(100).optional(),
  vaccinations: z.array(vaccinationSchema).default([]),
  treatments: z.array(treatmentSchema).default([]),
});

export type Vaccination = z.infer<typeof vaccinationSchema>;
export type Treatment = z.infer<typeof treatmentSchema>;
export type Dog = z.infer<typeof dogSchema>;
