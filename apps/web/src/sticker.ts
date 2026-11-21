// Photo of the rabies vaccine sticker in the passport, taken by the owner. Kept on this phone only
// (localStorage), shown on the owner's own pet card. Not in codes, not in backups.

const key = (petId: string) => `pawid.sticker.v1.${petId}`;

export function loadSticker(petId: string): string | null {
  try { return localStorage.getItem(key(petId)); } catch { return null; }
}

/** Returns false when the phone's storage is full. */
export function saveSticker(petId: string, dataUrl: string | null): boolean {
  try {
    if (dataUrl) localStorage.setItem(key(petId), dataUrl);
    else localStorage.removeItem(key(petId));
    return true;
  } catch {
    return false;
  }
}

/** Makes the photo small enough to keep: at most 1000 px on the long side, JPEG. */
export async function shrinkPhoto(file: File): Promise<string> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 1000 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return canvas.toDataURL("image/jpeg", 0.75);
}

/** An original drawing of the rabies page of a pet passport, with the vaccine sticker marked. */
export const PASSPORT_DRAWING = `<svg viewBox="0 0 340 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Drawing of the rabies vaccination page in a pet passport. The vaccine sticker is in the first column of each row, with the vaccine name, batch number and expiry.">
<rect x="1" y="1" width="338" height="188" rx="10" fill="#fff" stroke="#d6dbe3"/>
<rect x="1" y="1" width="338" height="30" rx="10" fill="#14233f"/><rect x="1" y="20" width="338" height="11" fill="#14233f"/>
<text x="14" y="21" font-size="11" font-weight="700" fill="#fff" font-family="system-ui, sans-serif">Vaccination against rabies</text>
<g font-family="system-ui, sans-serif" font-size="8" fill="#5b6472">
<text x="14" y="46">Vaccine (sticker)</text><text x="132" y="46">Date</text><text x="176" y="46">Valid from</text><text x="230" y="46">Valid until</text><text x="290" y="46">Vet</text>
</g>
<g stroke="#e3e7ee"><line x1="10" y1="52" x2="330" y2="52"/><line x1="10" y1="118" x2="330" y2="118"/><line x1="10" y1="178" x2="330" y2="178"/>
<line x1="124" y1="38" x2="124" y2="178"/><line x1="170" y1="38" x2="170" y2="178"/><line x1="224" y1="38" x2="224" y2="178"/><line x1="282" y1="38" x2="282" y2="178"/></g>
<rect x="14" y="58" width="104" height="54" rx="4" fill="#fffdf2" stroke="#f5b800" stroke-width="2.5"/>
<text x="20" y="72" font-size="9.5" font-weight="800" fill="#16181d" font-family="system-ui, sans-serif">VACCINE NAME</text>
<g fill="#16181d"><rect x="20" y="78" width="1.6" height="12"/><rect x="23" y="78" width="0.8" height="12"/><rect x="25.5" y="78" width="2" height="12"/><rect x="29" y="78" width="0.8" height="12"/><rect x="31" y="78" width="1.6" height="12"/><rect x="34" y="78" width="2.4" height="12"/><rect x="38" y="78" width="0.8" height="12"/><rect x="40.5" y="78" width="1.6" height="12"/><rect x="44" y="78" width="0.8" height="12"/><rect x="46" y="78" width="2" height="12"/><rect x="49.5" y="78" width="1" height="12"/><rect x="52" y="78" width="1.6" height="12"/></g>
<g font-size="7.5" fill="#3a4150" font-family="ui-monospace, monospace"><text x="20" y="100">Lot  A123B45</text><text x="20" y="108">Exp  2027-08</text></g>
<g font-size="8.5" fill="#16181d" font-family="ui-monospace, monospace"><text x="129" y="88">01.03</text><text x="129" y="98">2026</text><text x="176" y="88">22.03</text><text x="176" y="98">2026</text><text x="230" y="88">01.03</text><text x="230" y="98">2029</text></g>
<path d="M288 92c6-8 10 4 16-4s8 6 14-2" fill="none" stroke="#14233f" stroke-width="1.4" stroke-linecap="round"/>
<rect x="14" y="124" width="104" height="48" rx="4" fill="none" stroke="#e3e7ee" stroke-dasharray="3 3"/>
</svg>`;
