# MatchFlow – Offene Punkte

Stand: 24.06.2026 | Branch: v1.7 | Aktuelle Version: v1.7.8

---

## ✅ v1.7.8 – Erledigt (24.06.2026)

- `skill_key` + `max_value` in Skill-Kategorien-Modal setzbar (war bereits am Standgerät implementiert)
- **Datenpflege noch offen:** Bestehende Skill-Kategorien in der App einmalig mit skill_key + max_value befüllen (siehe Referenztabelle unten)
- Registrierung: Rollen-Dropdown lädt jetzt direkt aus Firestore ohne Login
- Benutzerverwaltung: Reaktivieren-Button für inaktive Benutzer
- Permissions: Beim Login werden Permissions live aus Firestore-Rollen berechnet (kein Cache-Problem mehr bei Rollenänderungen)
- Leistungsmessungen: Tabs Messungstypen/Berechnungsmethoden/Kategorien auf `measurements.admin` Permission umgestellt (nicht mehr nur SuperAdmin)

### Referenz: Skill-Kategorien befüllen
| Kategorie | skill_key | max_value |
|-----------|-----------|-----------|
| SHOOT | shoot | 130 |
| SPEED | speed | 10 |
| ATTACK | attack | 100 |
| BONUS | bonus | 100 |
| SKILL | skill | 100 |
| PASS | pass | 100 |
| DEF | def | 100 |

---

## 🔴 v1.7.9 – Nächster Schritt (HIER WEITERMACHEN)

### Spieler-Uploads / Trainer-Review

**Was es ist:** Spieler reicht Heimwert ein (z.B. Zu Hause Schussgeschwindigkeit gemessen), Trainer sieht Einreichung und genehmigt oder lehnt ab.

**Was zu tun:**
- Neue Firestore-Collection: `submissions/{id}` mit Feldern: `player_id`, `measurement_type_id`, `value`, `source`, `status` (pending/approved/rejected), `session_id`, `tenant_id`, `created_at`
- UI für Spieler: Formular zum Einreichen eines Heimwerts (im Spieler-Bearbeiten-Modal oder eigenem Tab)
- UI für Trainer: Liste ausstehender Einreichungen, Genehmigen/Ablehnen Button
- Bei Genehmigung: Wert wird in `measurements` Collection übernommen, `_recalcSkillBase` aufrufen

---

## 🟡 v1.7.x – Weitere offene Punkte

### Camp-Tab bereinigen
- Berechtigungen für Camp-Bereich finalisieren
- Camp-Spieler (lokales JS-Array) langfristig in `players` Firestore-Collection überführen

---

## 📅 Langfristig (v1.8+)

- PPTX-Vorlage finalisieren & testen
- Spielerprofil-Export (Word/PDF)
- Offline-Fähigkeit (IndexedDB Cache)
- Audit Log + Undo
- Eltern-Portal (Anwesenheit erfassen, eigenes Kind sehen)
- Spieler-App (eigene Stats, XP, Regain-Nachrichten, News)
- Push-Benachrichtigungen (Training, Camp)
