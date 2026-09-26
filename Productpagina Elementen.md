# Productpagina Elementen (Taak B)

CRO/UX-elementen die nodig zijn op de productpagina, gebaseerd op de merkstrategie en persona-bezwaren. Uitgewerkt in volgorde in `Landingspagina Structuur.md`, sectie B — dit bestand is de losse checklist/rationale erachter.

1. **Sticky Add to Cart bar** — blijft zichtbaar bij scrollen, met prijs, variant-selector (maat/kleur) en CTA-knop. Voorkomt dat de koper terug moet scrollen om te bestellen.
2. **Probleem/oplossing GIF-sectie** — korte loop die het pijnpunt toont (bijv. rommelige koffer) → oplossing (georganiseerde inhoud met het product). Sluit direct aan op de pijnpuntentabel uit de merkstrategie.
3. **UGC/reviews-blok** — foto's/video's van klanten + sterrenreviews, idealiter filterbaar op reisdoel (gezin, stedentrip, backpack) zodat elke persona zich herkent.
4. **Maat-/compatibiliteitstabel** — vooral relevant voor koffers/rugtassen (handbagagematen per luchtvaartmaatschappij) — komt terug in persona 2's bezwaren.
5. **Trust-badges** — verzendtijd, retourbeleid, garantie — direct onder de CTA, om bezwaren uit de persona's weg te nemen.
6. **"In gebruik"-productfoto's** — geen steriele studio-only shots (conform de visuele richtlijnen), maar contextfoto's (vliegtuigstoel, kofferbak, rugzak onderweg).
7. **FAQ-sectie** — puntsgewijze beantwoording van de objections per persona (duurzaamheid, waterdichtheid, paskwestie).
8. **Bundel/upsell-blok** — bijv. "voeg de organizer toe aan je koffer" — sluit aan op de doorlopende-reis-gedachte uit pijler 2 van de merkstrategie.

**Shopify-implementatie — thema: Dawn (vastgesteld 21-09-2026):**
- Dawn (Shopify's gratis Online Store 2.0-thema) heeft **geen ingebouwde sticky add-to-cart bar** — dit vraagt een app (bijv. "Sticky Add To Cart", "Hextom") of een custom sectie via thema-app-extensions.
- UGC/reviews-blok: niet native in Dawn — via app (Loox, Judge.me, Okendo) die als sectie in de OS 2.0-sectiestructuur wordt ingeladen.
- Maat-/compatibiliteitstabel en FAQ: goed te bouwen met Dawn's ingebouwde "custom liquid" en "collapsible content" secties, geen app nodig.
- Bundel/upsell: Dawn heeft een native "related products" sectie; voor echte bundels (met gecombineerde prijs) is een app nodig (bijv. Shopify Bundles, PickyStory).
- Probleem/oplossing GIF-sectie en "in gebruik"-foto's: passen in Dawn's "image with text" / "multicolumn" secties, geen custom development nodig.

**Consequentie:** Dawn dekt de layout-basis goed (secties, blocks, thema-editor), maar sticky cart en UGC/reviews vragen sowieso apps — reserveer hier tijd/budget voor bij de buildfase.
