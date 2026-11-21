import { z } from "zod";
import { vetConfirmationSchema } from "./vetconfirm";

/**
 * Data model for a pet profile (dog or cat).
 * Field names follow the sections of the EU pet passport (model in Implementing
 * Regulation (EU) 2026/705). TODO: map every field 1:1 once the annex is reviewed.
 *
 * The same fields as the HosPet.eu pet card, so PawID can replace it.
 * Everything here is typed in by the owner. PawID never creates health data by itself.
 */

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

/** ISO 11784/11785 microchip: 15 digits. */
export const microchipSchema = z.string().regex(/^\d{15}$/, "The microchip number has 15 digits.");

/** ISO 3166-1 alpha-2, upper case. */
export const countryCode = z.string().regex(/^[A-Z]{2}$/, "expected a two-letter country code");

export const speciesSchema = z.enum(["dog", "cat"]);

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
  /** echinococcus = the tapeworm treatment some countries ask for dogs. */
  kind: z.enum(["echinococcus", "other"]),
  administeredOn: isoDate,
  /** Some countries require the treatment within a time window before entry. */
  note: z.string().max(200).optional(),
});

export const vetSchema = z.object({
  name: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
});

export const petSchema = z.object({
  id: z.string().min(1),
  species: speciesSchema.default("dog"),
  name: z.string().trim().min(1, "Add your pet's name.").max(100),
  breed: z.string().max(100).optional(),
  sex: z.enum(["female", "male"]).optional(),
  weightKg: z.number().positive().max(150).optional(),
  birthDate: isoDate.optional(),

  /** Identification. The chip is optional so a pet can be added before the vet visit. */
  microchip: microchipSchema.optional(),
  chipDate: isoDate.optional(),
  passportNumber: z.string().max(40).optional(),
  homeCountry: countryCode.optional(),
  /** National registry number, where the home country has one. */
  registryNumber: z.string().max(60).optional(),

  vaccinations: z.array(vaccinationSchema).max(200).default([]),
  /** Booster given before the previous vaccine expired, as written in the passport. */
  boosterInTime: z.boolean().optional(),
  treatments: z.array(treatmentSchema).max(500).default([]),

  /** Papers some trips need. Which ones apply comes from rules/, not from this schema. */
  healthCertificateDate: isoDate.optional(),
  titreTestDate: isoDate.optional(),

  vet: vetSchema.optional(),
  notes: z.string().max(1000).optional(),
  /** Microchip and rabies confirmed by a registered vet (see vetconfirm.ts). */
  vetConfirmation: vetConfirmationSchema.optional(),
  updatedAt: isoDate.optional(),
});

/** Kept for code written before cats were added. */
export const dogSchema = petSchema;

export type Vaccination = z.infer<typeof vaccinationSchema>;
export type Treatment = z.infer<typeof treatmentSchema>;
export type Pet = z.infer<typeof petSchema>;
export type Dog = Pet;
export type Species = z.infer<typeof speciesSchema>;
