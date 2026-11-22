# Vaccination obligations and schedules: France and Ireland (dogs, cats)

Research date (last_checked for every row below unless stated): **2026-11-22**
Scope: official or European sources only (ministries, government portals, national law, EU, national veterinary bodies, European universities). WSAVA, AAHA and US sources were excluded on purpose. Irish animal charities are listed as **secondary** sources.

Labels used:
- **VERIFIED**: I opened the primary document myself and the quote is copied from it.
- **VERIFIED (non-consolidated)**: copied from the text as originally published; I could not open the current consolidated version.
- **SECONDARY**: copied from a charity or professional journal page, not from a government or legal source.
- **UNCLEAR / NOT FOUND**: I could not find an official source. Do not show a number for these.

Access problems:
- **legifrance.gouv.fr** returned a Cloudflare challenge (HTTP 403) to every automated fetch, so no consolidated Code rural article could be read there. French law quotes below come from the Journal officiel PDF of the arrêté, the Sénat's adopted bill text, service-public.gouv.fr and agriculture.gouv.fr.
- **eur-lex.europa.eu** returned HTTP 202 with an empty body, so EU regulation text is quoted from Your Europe and from the Irish DAFM documents that reproduce it.
- **gov.ie** blocked WebFetch, but a plain HTTP fetch worked.

---

## 0. EU baseline (applies to both countries)

| Type | Species | Item | Age / interval | Quote | URL | Status |
|---|---|---|---|---|---|---|
| Obligation (travel only) | dog, cat, ferret | Rabies primary vaccination, minimum age | ≥ 12 weeks | "Your pet must be at least 12 weeks old before receiving its first or primary vaccination." | https://europa.eu/youreurope/citizens/travel/carry/pets-and-other-animals/index_en.htm (page says "Last checked: 01/09/2026") | VERIFIED |
| Obligation (travel only) | dog, cat, ferret | Wait after primary rabies vaccination | ≥ 21 days | "After this first or primary vaccination, you must wait at least 21 days before travelling with your pet." | same | VERIFIED |
| Obligation (travel only) | dog, cat, ferret | Booster timing | before the previous one expires | "Booster vaccinations must be given before the previous vaccination expires" | same | VERIFIED |
| Legal basis | all | Regulation in force | from 22 Apr 2026 | Your Europe cites "https://eur-lex.europa.eu/eli/reg_del/2026/131/oj"; DAFM: "Commission Delegated Regulation (EU) 2026/131 … From 22 April 2026, New EU rules apply". | Your Europe page above; DAFM notice in section 2 | VERIFIED that they cite it; **regulation text not opened** (EUR-Lex blocked) |

Note for the app: since 22 April 2026 the legal basis is Delegated Regulation (EU) 2026/131, not only Regulation (EU) 576/2013. The 12-week and 21-day figures appear in Your Europe (checked 01/09/2026) and in the DAFM notice of 05/08/2026, so they still hold. Someone should still read the article numbers in 2026/131 itself before citing it as the source.

---

## 1. FRANCE

### 1a. Legal obligations

| Type | Species | Vaccine | Age / interval | Quote (original) | Translation | URL | Status |
|---|---|---|---|---|---|---|---|
| Obligation | dog, category 1 | Rabies | always, even in rabies-free départements | « Un chien de 1re catégorie doit être vacciné contre la rage même si vous résidez dans un département indemne de rage. » | A category 1 dog must be vaccinated against rabies even if you live in a rabies-free département. | https://www.service-public.gouv.fr/particuliers/vosdroits/F1838 ("Vérifié le 07 novembre 2025") | VERIFIED |
| Obligation | dog, category 2 | Rabies | same | « Un chien de 2e catégorie doit être vacciné contre la rage même si vous résidez dans un département indemne de rage. » | Same rule for category 2. | same | VERIFIED |
| Obligation | dog, cat. 1–2 | Rabies, primary | from 3 months; valid after 21 days | « La primovaccination peut être effectuée à partir de l'âge de 3 mois et est valable qu'après 21 jours. » | The primary vaccination can be given from 3 months of age and is only valid after 21 days. | same | VERIFIED |
| Obligation | dog, cat. 1–2 | Rabies, boosters | as written in the passport | « La fréquence des rappels est indiquée dans le passeport. » | The booster frequency is written in the passport. | same | VERIFIED |
| Sanction | dog, cat. 1–2 | Rabies | n/a | « Le fait de ne pas faire vacciner régulièrement un chien de 1re catégorie contre la rage est passible d'une amende de 450 €. » (same sentence for 2e catégorie) | Not keeping a category 1 (or 2) dog's rabies vaccination up to date can lead to a €450 fine. | same | VERIFIED |
| Legal text | dog, cat. 1–2 | Rabies, permit condition | valid vaccination needed for the permis de détention | Art. L. 211-14 II 1° b): « De la vaccination antirabique du chien en cours de validité ; » | A rabies vaccination that is still valid. | https://www.senat.fr/leg/tas07-109.html (Sénat, loi chiens dangereux, adopted 12 June 2008 = loi n° 2008-582) | VERIFIED (2008 wording; **current consolidated L211-14 not opened**, Légifrance blocked) |
| Legal refs | dog, cat. 1–2 | n/a | n/a | service-public lists: « Code rural et de la pêche maritime : articles L211-11 à L211-28 », « article L215-1 », « L215-2 », « L215-2-1 », « D211-3-1 à D211-3-4 », « R211-5 à R211-7 », « article R215-2 » (sanctions … vaccination) | Legal basis listed by the government portal. | F1838 above | VERIFIED as a list (article texts not opened) |
| Obligation | dog, cat. 1–2 | (context) permit age | provisional permit under 8 months, valid to 12 months | « il vous est délivré un permis provisoire valable jusqu'à ses 12 mois » | A provisional permit is issued, valid until the dog is 12 months old. | F1838 | VERIFIED |
| Obligation (travel) | dog, cat, ferret | Rabies | from 12 weeks; effective after ≥ 21 days | « Le vaccin antirabique est possible à partir de 12 semaines (3 mois) et prend effet au moins 21 jours (3 semaines) plus tard. » | Rabies vaccination is possible from 12 weeks (3 months) and takes effect at least 21 days (3 weeks) later. | https://www.service-public.gouv.fr/particuliers/vosdroits/F21374 ("Vérifié le 28 avril 2026") | VERIFIED |
| Obligation (travel) | dog, cat, ferret | Rabies booster | "annual" (see conflict note) | « Il doit faire l'objet d'un rappel annuel. » | It must get an annual booster. | F21374 | VERIFIED quote, **content conflicts with the arrêté; see note F1** |
| Obligation (travel) | dog, cat, ferret | Order: chip before vaccine | n/a | « La vaccination doit être réalisée après l'identification pour être reconnue valable. » | Vaccination must be done after identification to count as valid. | F21374 | VERIFIED |
| Regulation (national) | all domestic carnivores | Rabies, protocol | per manufacturer; primary validity ≤ 1 year | Arrêté 10 oct. 2008, art. 3: « La primo-vaccination et la vaccination de rappel antirabiques des carnivores domestiques … sont pratiquées conformément au protocole d'emploi établi par les instituts producteurs pour chaque vaccin … Toutefois, ce protocole ne peut en aucun cas, et quel que soit le vaccin, porter à plus d'un an la durée de la validité de la primo-vaccination antirabique des animaux domestiques. » | Primary and booster rabies vaccination follow the manufacturer's protocol for each authorised vaccine. However, the primary vaccination can never be valid for more than one year, whatever the vaccine. | JO 23 Oct 2008, NOR AGRG0824222A. Légifrance: https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000787191/ (blocked). Copy read: JO facsimile PDF on zoopsy.com (third-party host, text identical to JO layout) | VERIFIED (non-consolidated) |
| Regulation (national) | all domestic animals | Rabies, start of validity | 21 days after end of manufacturer's primary protocol; boosters valid same day | Art. 7: « La certification de la primo-vaccination antirabique des animaux domestiques n'est considérée comme valable qu'à partir de vingt et un jours après la fin du protocole de vaccination prescrit par le fabricant … La certification de vaccination antirabique de rappel … prend effet le jour de son établissement » | Primary rabies vaccination counts as valid only from 21 days after the manufacturer's protocol ends. A booster certificate takes effect on the day it is issued. | same | VERIFIED (non-consolidated) |
| Regulation (national) | dogs, cats, ferrets | Rabies, proof | passport only (since 1 Jan 2009) | Art. 6: « La primo-vaccination et les rappels de vaccination antirabiques des carnivores domestiques sont attestés au moyen des informations … de la rubrique IV … du passeport pour animal de compagnie » | Proof of rabies vaccination for dogs, cats and ferrets is the pet passport. | same | VERIFIED (non-consolidated) |
| Ministry info | dogs, cats | Rabies, list of mandatory cases | from 3 months | « La vaccination des chiens et chats est obligatoire à partir de l'âge de 3 mois : - pour les animaux vivant en zone infectée - pour voyager à l'étranger - pour entrer en France ou revenir en France - pour les chiens considérés dangereux par la loi » | Rabies vaccination of dogs and cats is mandatory from 3 months: animals in an infected zone; travel abroad; entering or returning to France; dogs classed as dangerous by law. | https://agriculture.gouv.fr/sites/minagri/files/2015-7volets_verso.pdf (Ministère de l'Agriculture leaflet, 2015) | VERIFIED quote; **dated 2015** |
| Obligation? | dog, cat | Campsites, shows, boarding kennels | n/a | Ministry leaflet: « Les vaccinations sont souvent exigées pour les animaux laissés en pension ou garderie » | Vaccinations are often required for animals left in boarding or day care. | 2015 leaflet above | VERIFIED quote. **No national legal rule found** for campsites or dog shows. These are rules set by each establishment or organiser. Mark as UNCLEAR, never as a legal obligation |

**Note F1 (conflict on rabies booster interval).** service-public F21374 says « rappel annuel » (annual booster). The arrêté of 10 Oct 2008 art. 3 says boosters follow the manufacturer's protocol. A 2016 parliamentary written question (AN QE 94614, answer JO 5 July 2016) records that Merial changed the Rabisin protocol in June 2014 so that boosters are given every three years. The government answer refused to amend art. 3 for the primary vaccination, and did not contradict the 3-year booster. The DAFM notice for Ireland (section 2) also says validity is "either one or three years". **Inference:** the legal booster date is the "valid until" date the vet writes in the passport. The app should read it from there, not compute a fixed annual interval. URL: https://www.assemblee-nationale.fr/dyn/14/questions/QANR5L14QE94614

### 1b. Recommended puppy/kitten schedule (non-rabies)

| Type | Species | Vaccine | Age / interval | Quote (original) | Translation | URL | Status |
|---|---|---|---|---|---|---|---|
| Recommendation (ministry, general) | dog, cat | first vaccination | 7–8 weeks; regular boosters | « Le protocole de vaccination peut dépendre des vaccins utilisés, des risques propres à chaque animal selon son mode de vie, ainsi que de la législation en vigueur. La première injection est généralement réalisée dès l'âge de 7 à 8 semaines. Des rappels réguliers sont nécessaires, quel que soit l'âge, pour maintenir l'immunité. » | The protocol depends on the vaccines, each animal's lifestyle risks and the law. The first injection is usually given from 7 to 8 weeks of age. Regular boosters are needed at every age to keep immunity. | https://agriculture.gouv.fr/sites/minagri/files/2015-7volets_verso.pdf | VERIFIED (2015 leaflet; no booster interval, no list of diseases) |
| Recommendation (French veterinary journal) | dog | core: DA2P (distemper, hepatitis, parvovirus) + leptospirosis | **ages not visible** | Abstract: « Les protocoles de vaccination concernant les valences essentielles DA2P chez le chien » … leptospirosis (L, L2, L3, L4) also covered | Vaccination protocols for the core DA2P components in dogs. | Freyburger L., Thary V., Legros V., "Recommandations vaccinales pendant la consultation pubertaire", *Revue vétérinaire clinique* 60(4), Nov 2025, p. 190-197, doi:10.1016/j.anicom.2025.08.006, https://www.em-consulte.com/article/1770466/recommandations-vaccinales-pendant-la-consultation | SECONDARY (journal; full text paywalled, only the abstract read). Core list usable, **no ages or intervals** |
| Recommendation (same) | cat | core: RCP (rhinotracheitis/herpes, calicivirus, panleukopenia) | not visible | Abstract: RCP protocol for cats; FeLV described as a « vaccination circonstancielle » | FeLV is a situational ("non-core") vaccine. | same | SECONDARY, partial |
| Recommendation | dog | CHPPiL, kennel cough, leishmaniasis | **NOT FOUND** | n/a | n/a | n/a | UNCLEAR: no official French page (Ordre national des vétérinaires, AFVAC, ANSES, the four ENV schools) with a public puppy schedule in weeks was found. An ENVT thesis (Cadier 2014) was found, but its schedule is taken from WSAVA/AAHA, so it was excluded |
| Recommendation | cat | typhus, coryza, leucose (FeLV), chlamydia | **NOT FOUND** | n/a | n/a | n/a | UNCLEAR: same gap |

**France summary.** The only legal vaccination obligations are rabies:
- category 1 and 2 dogs (permit condition; €450 fine; from 3 months, valid after 21 days);
- travel and entry into France (from 12 weeks, valid after 21 days);
- animals in an infected zone (historical, per the 2015 leaflet).

No disease other than rabies is legally required. No official national puppy or kitten schedule in weeks was found. The ministry gives only "first injection from 7–8 weeks, regular boosters". The ages for CHPPiL and typhus/coryza/leucose must be marked **unclear / ask your vet** unless an AFVAC or ENV document is found later.

---

## 2. IRELAND

### 2a. Legal obligations

| Type | Species | Vaccine | Age / interval | Quote | URL | Status |
|---|---|---|---|---|---|---|
| No domestic obligation | dog | any | n/a | Control of Dogs Act 1986: the full text has **no occurrence** of "vaccin" or "rabies" (searched) | https://www.irishstatutebook.ie/eli/1986/act/32/enacted/en/print | VERIFIED (as enacted; later amending Acts not checked word by word) |
| No domestic obligation | dog | any | n/a | Dog Breeding Establishments Act 2010: **no occurrence** of "vaccin" | https://www.irishstatutebook.ie/eli/2010/act/29/enacted/en/print | VERIFIED (as enacted) |
| Power only | all animals | vaccines | n/a | Animal Health and Welfare Act 2013, Schedule (regulation-making matters), item 36: "The regulation or prohibition of the use or possession of vaccines in the interest of animal health." Rabies is item 66 in the list of diseases. | https://www.irishstatutebook.ie/eli/2013/act/15/enacted/en/print | VERIFIED. The Act gives the Minister powers but sets **no** pet vaccination duty |
| No vaccine rule at sale | dog, cat | n/a (minimum sale age) | 8 weeks | S.I. 681/2019 reg. 3: "A person shall not sell or supply an unweaned pet animal or— (a) a dog or cat that has not attained the age of 8 weeks" | https://www.irishstatutebook.ie/eli/2019/si/681/made/en/print | VERIFIED. No vaccination requirement in this S.I. (searched) |
| Statutory guidelines | dogs in breeding establishments | "vaccination programmes" (unspecified) | adult dogs: vet exam yearly | 3.8: "Each adult dog must be examined by a registered veterinary practitioner at least once a year. A suitable animal health programme agreed with/by a registered veterinary practitioner will be required and must be implemented. This will include vaccination programmes…" | Dog Breeding Establishment Guidelines, July 2018 (in force 1 Jan 2019, under s.15(4) DBE Act 2010): https://assets.gov.ie/static/documents/dog-breeding-establishment-guidelines-f741b375-a00f-4a3f-ac80-4b0d68acf94b.pdf | VERIFIED. Applies to breeders only. No diseases or ages listed |
| Statutory guidelines | pups for export (breeders) | Rabies | n/a | 8.6: "Pups due for export must be micro-chipped, have a completed pet passport and must have received a rabies vaccination from a veterinary practitioner." | same | VERIFIED |
| Obligation (travel only) | dog, cat, ferret | Rabies primary | ≥ 12 weeks; travel ≥ 21 days later (longer if the datasheet says so) | "Pet animals cannot travel to another Member State until at least 21 days after their primary rabies vaccination (but can be more depending on the datasheet of the vaccine used); 12 weeks of age is the minimum age at which primary rabies vaccination can be administered for the purposes of EU pet travel." | DAFM, "Pet Passports – Information for PVPs", 05 Aug 2026: https://assets.gov.ie/static/documents/09fe3ad4/Notice_to_PVPs_RE_Pet_Passports_05_08_2026_1.pdf | VERIFIED |
| Obligation (travel only) | dog, cat, ferret | Microchip before rabies vaccine | same day or before | "Date of application or reading of microchip number should be BEFORE or the same day as the rabies vaccine administration recorded in the passport." | same | VERIFIED |
| Obligation (travel only) | dog, cat, ferret | Rabies booster validity | 1 or 3 years per manufacturer; booster within validity takes effect same day | "Box no 3: Date vaccine is valid until as per manufacturers' instructions, either one or three years from date of vaccination" / "if it is a booster vaccination administered within the period of validity of the previous valid rabies vaccine, this date is the same as the date administered." | same | VERIFIED |
| Rule for vets | dog, cat, ferret | Rabies, start of validity | ≥ 21 days, or longer per datasheet; day of vaccination = day 0 | "21 days is the minimum, (so even if a vaccine says immunity after 10 days you cannot put less than 21 days into the pet passport) but there is no maximum" | DAFM, "Advice for PVPs on Rabies Vaccine Immunity Periods", Jan 2026: https://assets.gov.ie/static/documents/09fe3ad4/Jan_26_Period_of_validity_rabies_vaccines.pdf | VERIFIED |
| Travel-related | dog | Tapeworm (not a vaccine) | for entry only | "There is no tapeworm treatment required to leave Ireland, but you will need to visit a vet abroad to get tapeworm treatment for a dog to return to Ireland" | DAFM "Pet Travel" page, last updated 5 Aug 2026: https://www.gov.ie/en/department-of-agriculture-food-and-the-marine/publications/pet-travel/ | VERIFIED |
| Related timing | dog | Microchip (not a vaccine) | by 12 weeks | S.I. 63/2015 reg. 3(2): "(a) a dog born after 1 June 2015 upon it reaching the age of 12 weeks" | https://www.irishstatutebook.ie/eli/2015/si/63/made/en/print | VERIFIED. Useful in the timeline because the chip must come before the rabies vaccine |

### 2b. Recommendations (no government or university schedule found; charity sources only)

| Type | Species | Vaccine | Age / interval | Quote | URL | Status |
|---|---|---|---|---|---|---|
| Recommendation | dog | Core list | n/a | "Core vaccines protect against: Parvovirus … Canine distemper … Infectious hepatitis (adenovirus) … Leptospirosis" | Irish Blue Cross: https://bluecross.ie/pet-advice/vaccinating-your-dog-what-you-need-to-know/ | SECONDARY |
| Recommendation | dog | Primary course | 1st dose ~6–8 wk; 2nd 2–4 wk later; protected ~2 wk after last | "First injection at around 6–8 weeks of age / Second injection 2–4 weeks later / Your puppy will usually be fully protected two weeks after their final injection." | same | SECONDARY |
| Recommendation | dog | Boosters | Lepto yearly; DHP every 3 years | "Leptospirosis boosters are usually given every year / Distemper, parvovirus and infectious hepatitis boosters are typically given every three years" | same | SECONDARY |
| Recommendation | dog | Non-core | kennel cough by lifestyle; rabies for travel | "Kennel cough – recommended for dogs that mix with other dogs or attend kennels or day care. / Rabies – legally required for dogs travelling outside Ireland." | same | SECONDARY |
| Recommendation | dog | Kennel cough duration | ~12 months | "The kennel cough vaccine usually lasts around 12 months." | https://bluecross.ie/pet-advice/canine-kennel-cough/ | SECONDARY |
| Recommendation | dog | Primary course | from 6 wk; 2nd 2–4 wk later | "Most puppies should get the first of their core vaccinations from six weeks of age. They should receive a second vaccine two to four weeks later, depending on the puppy's age and the vaccine brand." | Dogs Trust Ireland (datePublished 2022-05-31): https://www.dogstrust.ie/dog-advice/health-wellbeing/vet-care/vaccinations | SECONDARY |
| Recommendation | dog | Boosters | first-year booster; lepto yearly; CAV/CPV/CDV every 3 yrs | "As well as a first-year booster, your pup will typically need: a top-up dose of leptospirosis vaccine every year / top-up doses of canine adenovirus, canine parvovirus and canine distemper vaccines every three years." | same | SECONDARY |
| Recommendation | dog | Rabies (domestic) | not needed unless travelling | "It's not present in Ireland, and vaccination against rabies is not essential for dogs here." | same | SECONDARY |
| Recommendation | cat | Core / non-core | n/a | "In Ireland, core cat vaccines are considered the following: Feline enteritis (feline parvovirus / panleukopenia) / Cat flu (feline herpesvirus (FHV) and feline calicivirus (FCV)) / Non-core vaccines: Feline leukaemia virus (FeLV) / Rabies" | Irish Blue Cross: https://bluecross.ie/pet-advice/cat-and-kitten-vaccinations/ | SECONDARY |
| Recommendation | cat | Primary course | 1st from ~8–9 wk; 2nd 3–4 wk later; some need 3rd at 16–20 wk | "The first injection is usually given from around 8–9 weeks of age / The second injection follows 3–4 weeks later / Some kittens may require a third injection at around 16-20 weeks" | same | SECONDARY |
| Recommendation | cat | Boosters | 1 yr after primary; then every 1–3 yrs by vaccine | "Most cats need a booster injection a year after their initial course. After this, boosters are usually required every 1–3 years, depending on the vaccine." | same | SECONDARY |
| Practice (not law) | dog | Kennel cough for boarding | n/a | NSPCA Pet Hotel: "For dogs, the Kennel Cough vaccine is mandatory." "Dogs who receive a live Kennel Cough vaccine must wait 14 days before checking in" | https://nspca.ie/pet-hotel/terms-conditions/ | SECONDARY: one establishment's terms, **not** a legal duty. (ispca.ie and dspca.ie searches now land on nspca.ie) |
| Recommendation | dog, cat | any | **NOT FOUND** | Veterinary Ireland site search: "Looks like we couldn't find any items containing 'vaccination'." No vaccination page found from the Veterinary Council of Ireland or the UCD School of Veterinary Medicine / UCD Veterinary Hospital. | https://www.veterinaryireland.ie/ ; https://www.ucd.ie/vthweb/clients | UNCLEAR |

**Ireland summary.** There is no legal duty to vaccinate a pet dog or cat that stays in Ireland. Rabies is required only for travel: from 12 weeks, travel ≥ 21 days later (or longer per the datasheet), booster validity 1 or 3 years per the manufacturer. Breeders under the DBE guidelines need a vet-agreed "vaccination programme" with no diseases or ages stated, and pups for export need rabies.

Recommended schedules come only from Irish charities (Blue Cross, Dogs Trust Ireland):
- puppies: from 6–8 weeks plus a 2nd dose 2–4 weeks later;
- leptospirosis: yearly;
- DHP: every 3 years after the first-year booster;
- kennel cough: by lifestyle;
- kittens: 8–9 weeks + 3–4 weeks later (third dose at 16–20 weeks in some);
- cat core vaccines: enteritis + cat flu; FeLV is non-core.

---

## 3. Verified facts vs inference (for the app)

Verified facts (safe to show with source):
- FR: category 1–2 dogs need rabies vaccination. Primary from 3 months, valid after 21 days, €450 fine (service-public F1838).
- FR + IE + EU travel: rabies from 12 weeks, valid ≥ 21 days after primary, microchip first, booster before expiry.
- FR arrêté 2008: primary validity ≤ 1 year; booster takes effect the same day; protocol per manufacturer.
- IE: booster validity "either one or three years" per manufacturer (DAFM 2026).
- IE: no domestic vaccination duty in the Control of Dogs Act 1986, the DBE Act 2010 or S.I. 681/2019 (word search).

Inference (show as a hint, not as a rule):
- Booster due dates for rabies should be read from the passport's "valid until" field, not computed. Reason: service-public says "annual", but the arrêté and DAFM say it depends on the manufacturer (1 or 3 years).
- A dog cannot travel in the EU before about 15 weeks (12 + 3). DAFM states this for commercial movements: "pups must be a minimum of 15 weeks old before they are eligible to travel between Member States". Some Member States have a derogation for young animals.

Unclear (do not compute):
- FR non-rabies schedule (CHPPiL, kennel cough, leishmaniasis; cat typhus/coryza/FeLV): no official ages found.
- FR legal rabies duty for campsites and dog shows: no national text found. These are the operators' own rules.
- IE: no government or university schedule. Charity schedules only.
- Current consolidated text of Code rural L211-14 and of the arrêté 10 Oct 2008 (Légifrance blocked); article text of Delegated Reg. (EU) 2026/131 (EUR-Lex blocked).

## 4. Excluded sources (on purpose)
- Cadier J., *Gestion des maladies infectieuses du chiot*, thèse ENVT 2014 (https://archivet.envt.fr/oatao.univ-toulouse.fr/11299/1/Cadier_11299.pdf): its schedule is taken from WSAVA/AAHA.
- Insurers, pet food brands and vaccine makers (Allianz, Royal Canin, MSD, Santévet, Groupama…): not official.
- UC Davis, Purdue and other US universities: excluded by the brief.
