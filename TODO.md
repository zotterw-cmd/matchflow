# MatchFlow – Offene Punkte

Stand: 25.06.2026 | Branch: v1.7 | Aktuelle Version: v1.7.8 → ab nächster Session: v1.7.8.x

---

## ✅ v1.7.8 – Erledigt (24.–25.06.2026)

### Aus vorheriger Session (Datenpflege)
- `skill_key` + `max_value` in Skill-Kategorien-Modal setzbar
- Registrierung: Rollen-Dropdown lädt direkt aus Firestore ohne Login
- Benutzerverwaltung: Reaktivieren-Button für inaktive Benutzer
- Permissions: beim Login live aus Firestore-Rollen berechnet
- Leistungsmessungen: Tabs auf `measurements.admin` Permission umgestellt

### Mannschaften
- Drag & Drop Reihenfolge (sort_order wird in Firestore gespeichert)
- Soft-Delete (Admin) + Hard-Delete + Restore (SuperAdmin)
- Toggle Aktiv/Inaktiv wieder vorhanden
- Gruppenanzeige korrigiert

### Vereinsprofil (neuer Menüpunkt "Verein")
- Vereinsname, Vereinsfarben (dynamisch erweiterbar), Logo-Upload
- PLZ, Ort, Adresse → Google Maps Embed (660px, 100% Breite, teilbar)
- Website, Kontakt-E-Mail
- Mehrere Vereinsadmins (aus Benutzerliste, keine Eltern/Spieler)
- Gespeichert in `tenants/{tid}.profil`

### Lieblingsverein-Modul
- Globales App-Setting (`app_settings/{tid}.lieblingsverein_modul`)
- Toggle in Media Storage durch SuperAdmin
- SuperAdmin sieht Logos (klickbare Kacheln), alle anderen nur Text-Badges
- Mehrere Lieblingsvereine pro Spieler wählbar, in `player_seasons` gespeichert

### CSV-Import für Spieler
- Semicolon-CSV (Format camp2026.csv: 65 Kids)
- Automatische Mannschaftszuweisung + Gruppen-Mapping
- Duplikat-Erkennung (überspringen / überschreiben / mergen)
- Teams + group_ids werden bei bestehenden Spielern zusammengeführt

### Camp-Tab Firestore-Migration
- `_campSpielerView()`: liest spielerData gefiltert nach Team "Camp" (enthält 'camp')
- Messwerte werden in `player_seasons.campScore` gespeichert (via `fsSaveSpieler`)
- Migrations-Banner: einmalig camp.spieler-Array → spielerData übertragen
- Soft-Delete/Restore/Hard-Delete auf spielerData umgestellt
- `openCampSpielerModal` leitet auf globales Spieler-Modal weiter

### Referenz: Skill-Kategorien befüllen (manuelle Datenpflege in App)
| Kategorie | skill_key | max_value |
|-----------|-----------|-----------|
| SHOOT     | shoot     | 130       |
| SPEED     | speed     | 10        |
| ATTACK    | attack    | 100       |
| BONUS     | bonus     | 100       |
| SKILL     | skill     | 100       |
| PASS      | pass      | 100       |
| DEF       | def       | 100       |

---

## 🔴 v1.7.9 – Nächster Schritt (HIER WEITERMACHEN)

### Trainings-TODOs
- Training/Spiel: offene Punkte aus v1.7.x finalisieren
- Trainingsplan: Wochenansicht, Spieltage einplanen
- Anwesenheitsliste pro Training (wer war da, wer nicht)

### Eltern-Portal
- Elternteil sieht nur eigenes Kind (Profil, Stats, XP, Regain-Nachrichten)
- Anwesenheit erfassen (Kind hat teilgenommen / krank / entschuldigt)
- Keine Admin-Funktionen sichtbar

### Spieler-Bereich (Kind-App)
- Eigene Stats, XP-Stand, Fortschritt
- Regain-Nachrichten empfangen
- News / Ankündigungen sehen

### Spieler-Uploads / Trainer-Review
- Spieler reicht Heimwert ein (z.B. Heimtraining Schussgeschwindigkeit)
- Trainer sieht Einreichungen und genehmigt oder lehnt ab
- Neue Firestore-Collection: `submissions/{id}` mit: `player_id`, `measurement_type_id`, `value`, `source`, `status` (pending/approved/rejected), `session_id`, `tenant_id`, `created_at`
- Bei Genehmigung: Wert in `measurements` übernehmen, `_recalcSkillBase` aufrufen

---

## 📅 Langfristig (v1.8+)

- PPTX-Vorlage finalisieren & testen
- Spielerprofil-Export (Word/PDF)
- Offline-Fähigkeit (IndexedDB Cache)
- Audit Log + Undo
- Push-Benachrichtigungen (Training, Camp)
- Camp-Tab Berechtigungen finalisieren
