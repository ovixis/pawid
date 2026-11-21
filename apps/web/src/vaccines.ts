// Rabies vaccines for dogs and cats, as suggestions for the form. Each one is listed as authorised
// in the EU veterinary medicines database (medicines.health.europa.eu, checked 2026-11-21).
// Which ones a vet uses differs by country; the owner can always write the name from the passport sticker.
export interface Vaccine { name: string; maker: string; for: ("dog" | "cat")[] }

export const RABIES_VACCINES: readonly Vaccine[] = [
  { name: "Nobivac Rabies", maker: "MSD Animal Health", for: ["dog", "cat"] },
  { name: "Rabisin", maker: "Boehringer Ingelheim", for: ["dog", "cat"] },
  { name: "Versiguard Rabies", maker: "Zoetis", for: ["dog", "cat"] },
  { name: "Rabigen Mono", maker: "Virbac", for: ["dog", "cat"] },
  { name: "Biocan R", maker: "Bioveta", for: ["dog", "cat"] },
  { name: "Biocan R Plus", maker: "Bioveta", for: ["dog", "cat"] },
  { name: "Biocan Novel R", maker: "Bioveta", for: ["dog"] },
  { name: "Purevax Rabies", maker: "Boehringer Ingelheim", for: ["cat"] },
];
