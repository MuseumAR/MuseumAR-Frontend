# Offline Content Distribution — Product Specification

| Field | Value |
|---|---|
| **Document ID** | MAR-SPEC-OFFLINE-001 |
| **Title** | Offline packages by exhibition, navigation pack, and on-demand exhibit media |
| **Status** | Proposed (to-be). Not implemented in current code. |
| **Version** | 1.0 |
| **Date** | 2026-08-26 |
| **Owner** | Product / BA |
| **Related** | `docs/BUSINESS-RULES.md` BR-145–BR-152, BR-178–BR-190; INV-04 |
| **Code** | This document does **not** authorize implementation. Backend, CM dashboard, and mobile/Unity SHALL follow this spec when a later change is approved. |

---

## 1. Problem (as-is)

One ZIP is generated per content version for the **entire museum**. The visitor (mobile) is expected to download that archive before the visit. Audio, images, and AR for every exhibit are included even if the visitor only bought a ticket for one exhibition or will only scan a few QR codes.

`GET /api/visitor/sync-check` returns a **single** `OfflinePackageDto`. The Content Manager generate form sends only `{ versionId }`.

## 2. Decisions (locked)

These four decisions close the gaps in the earlier backend-only plan.

| # | Gap | Decision |
|---|---|---|
| D1 | Ticket may have no exhibition | Package choice is derived from the **paid ticket**, not from “always exhibition”. See §4. |
| D2 | Exhibition ZIP still heavy if it contains all maps | Exhibition ZIP = **exhibit media only**. Indoor maps live in a **shared navigation pack**. See §3. |
| D3 | Exhibition ZIP vs lazy-load conflict | **Ordered pipeline**, not two parallel products. See §5. |
| D4 | Visitor still gets one museum ZIP | `sync-check` (or successor) returns **navigation pack + resolved media pack** (nullable). See §7. |

**Teacher note (media-type split):** Separate audio / image / AR ZIPs are **not** required if §5 Layer C (per-exhibit lazy load) is implemented. Unused media is not downloaded. Do not claim “three media ZIPs” in the thesis unless that extra axis is built.

---

## 3. Package layers

| Layer | Name | `ExhibitionId` | Contents | Typical size |
|---|---|---|---|---|
| **A** | Navigation pack | always `null` (museum-wide) | Manifest JSON: rooms, waypoints, edges, tours (stop exhibit IDs only), exhibit **metadata** (id, title, QR, room/floor). **2D floor-plan images** for indoor routing. No exhibit audio. No AR models. | Small |
| **B** | Media pack | `null` = whole museum; `int` = one exhibition | Binary media of in-scope exhibits: images, audio guides, AR assets. **SHALL NOT** dump every museum floor-plan PNG again. | Large |
| **C** | On-demand exhibit media | n/a | Single exhibit’s audio / image / AR, fetched on QR scan or exhibit detail, then cached. | Per exhibit |

**ZIP file names (canonical)**

- Navigation: `museum_{museumId}_v{versionId}_nav.zip` (or equivalent JSON + images bundle).
- Whole-museum media: `museum_{museumId}_v{versionId}.zip`
- Exhibition media: `museum_{museumId}_exhibition_{exhibitionId}_v{versionId}.zip`

Do not use the abbreviated `exhib_` token.

**In-scope exhibits for Layer B when `ExhibitionId` is set:** rows in `ExhibitionExhibits` for that exhibition, intersected with exhibits of that museum and that content version. An exhibit in two exhibitions MAY appear in two media ZIPs (duplication accepted). An exhibit in no exhibition appears **only** in the whole-museum media pack.

---

## 4. Which media pack the visitor downloads (D1)

Paid ticket means status Paid / Active (same as shop/check-in). If the visitor holds several paid tickets, use the ticket **for this visit** (the one they select, or the only paid ticket).

| Ticket | Layer A | Layer B |
|---|---|---|
| Paid, `TicketType.exhibitionId` = E | Download navigation pack once | Download **one** exhibition media ZIP for E |
| Paid, `TicketType.exhibitionId` = null (whole museum) | Download navigation pack once | Download **one** whole-museum media ZIP. SHALL NOT require N exhibition ZIPs. |
| No paid ticket / Guest | Download navigation pack if the product allows public offline maps; otherwise online-only maps | Layer B skipped. Layer C only while online. |

There is no rule “always download the exhibition the user bought” without the whole-museum row. Whole-museum tickets are first-class.

---

## 5. Client pipeline (D3)

The mobile/Unity client SHALL execute in this order:

1. **Sync version** — compare local `versionId` with server.
2. **Layer A** — download / refresh navigation pack (mandatory for offline indoor routing).
3. **Layer B** — if §4 yields a media pack URL and it is not cached, download that **one** ZIP.
4. **Visit** — play media from cache when present.
5. **Layer C** — on exhibit QR / detail, if that exhibit’s media is missing from cache, download that exhibit only and store it. If offline and missing, show the existing empty/unavailable UI (no audio / no AR), do not fail the whole visit.

The client SHALL NOT download every exhibition ZIP “just in case” when §4 already selected one pack.

---

## 6. Content Manager generate (dashboard)

CM SHALL choose:

- Content version (required, SHOULD be published — BR-146).
- Scope: **Whole museum** (`exhibitionId` omitted or `null`) **or** one exhibition of the same museum.

Generate SHALL refuse:

- `exhibitionId` that is not an exhibition of that museum.
- Exhibition with **zero** exhibits (no empty ZIP).
- Duplicate of the same `(museumId, versionId, exhibitionId)` while an Available/Building pack exists (see §8). Policy: **reject** the second generate; CM deletes/replaces explicitly if a later story adds replace.

List of packages SHALL show scope (Whole museum vs exhibition name), size, `exhibitCount`, `imageCount`, `audioCount`, `arassetCount` for **that** scope only (BR-151).

This repo’s current form does not send `exhibitionId`. That is a **to-be** UI change, not done by this document.

---

## 7. Visitor API (D4)

As-is `GET /api/visitor/sync-check` returning one museum `OfflinePackageDto` is **insufficient**.

To-be contract (field names illustrative; backend may nest equivalently):

```text
GET /api/visitor/sync-check
Authorization: required for ticket-based Layer B; optional for public Layer A if product allows.

Response:
  versionId
  navigationPackage   { url, checksum, packageSizeBytes, status }   // Layer A
  mediaPackage        { url, checksum, packageSizeBytes, status, exhibitionId } | null
```

**Server resolution of `mediaPackage`**

1. If authenticated Visitor has a paid ticket with `exhibitionId` E, and an Available exhibition media pack exists for current version + E → that pack.
2. Else if authenticated Visitor has a paid whole-museum ticket, and an Available whole-museum media pack exists → that pack.
3. Else → `mediaPackage` = null (client uses Layer C only).

Staff `GET /api/content/packages` MAY accept `?exhibitionId=` to filter the CM list. That filter SHALL NOT replace the visitor sync contract.

Optional: `GET /api/visitor/exhibits/{id}/media` for Layer C (audio, image, AR URLs or a small zip). If omitted, existing public exhibit media URLs MAY be used, then cached on device.

---

## 8. Data rules (backend)

| Rule | Statement |
|---|---|
| Nullable FK | `OfflinePackages.ExhibitionId` INT NULL. `null` = whole-museum **media** pack (Layer B). Navigation pack is a distinct package type or a distinct row convention (e.g. `PackageKind = Navigation`); it SHALL NOT be confused with Layer B `ExhibitionId` null. |
| Same museum | Exhibition referenced by a media pack SHALL belong to `OfflinePackages.MuseumId`. |
| Delete | `ON DELETE RESTRICT` from Exhibition to OfflinePackages. Deleting an exhibition SHALL fail while packs reference it. Do **not** `SET NULL` (that would silently turn an exhibition pack into a museum pack). |
| Unique (exhibition packs) | At most one Available/Building media pack per `(MuseumId, VersionId, ExhibitionId)` where `ExhibitionId IS NOT NULL`. |
| Unique (museum media) | At most one Available/Building whole-museum media pack per `(MuseumId, VersionId)` where `ExhibitionId IS NULL`. Implement with a **filtered unique index** (SQL Server: `NULL` is not unique otherwise). |
| Unique (navigation) | At most one Available/Building navigation pack per `(MuseumId, VersionId)`. |

If Layer A is stored in the same table, add `PackageKind` (`Navigation` | `Media`). Do not overload `ExhibitionId` alone to mean both “museum media” and “navigation”.

---

## 9. Verification (when implemented)

Expected results are **files and screens**, not HTTP status codes.

| # | Setup | Expected |
|---|---|---|
| V1 | Generate whole-museum media for a version | ZIP contains media for all published exhibits; name `museum_{id}_v{id}.zip`; list shows Whole museum |
| V2 | Generate exhibition with 2–3 exhibits | ZIP smaller than V1; only those exhibits’ audio/images/AR; **no** extra exhibits; name uses `exhibition_{id}` |
| V3 | Generate exhibition with 0 exhibits | Generate refused; no ZIP row Available |
| V4 | Generate with exhibition of another museum | Generate refused |
| V5 | Paid ticket for exhibition E | sync-check `mediaPackage.exhibitionId` = E |
| V6 | Paid whole-museum ticket | sync-check `mediaPackage.exhibitionId` = null (museum media), not a list of all exhibitions |
| V7 | Guest / no paid ticket | `mediaPackage` null; QR of an exhibit while online still can fetch Layer C |
| V8 | Counts on list | `audioCount` of exhibition pack equals audio files of those exhibits, not the museum total |
| V9 | Duplicate generate same version+exhibition | Second generate rejected |
| V10 | Delete exhibition that has a pack | Delete exhibition refused until pack removed |

---

## 10. Traceability

| Topic | Rules |
|---|---|
| Version / generate / download as-is | BR-145–BR-149, BR-151–BR-152 |
| Layers, ticket resolution, pipeline, APIs | BR-178–BR-190 |
| Exhibition is grouping, not a room | INV-04 |
| Ticket type optional exhibition | BR-099, BR-105 |

## 11. Out of scope

- Implementing this spec in Next.js, ASP.NET, or Unity (separate change).
- Splitting Layer B into three ZIPs by MIME type (audio vs image vs AR).
- Changing PayOS or check-in.

## 12. Revision history

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-08-26 | Locked D1–D4: ticket-based pack choice, media vs navigation layers, ordered pipeline, visitor sync contract |
