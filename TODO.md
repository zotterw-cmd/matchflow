# MatchFlow – Offene Punkte

Stand: 24.06.2026 | Branch: v1.7 | Aktuelle Version: v1.7.7

---

## 🔴 v1.7.8 – Nächster Schritt (HIER WEITERMACHEN)

### Skill-Kategorien: `skill_key` + `max_value` in der App setzbar

**Warum dringend:** `_calcSkill()` ist fertig implementiert, gibt aber `null` zurück solange `max_value` auf der Skill-Kategorie fehlt. Kein `max_value` = kein Skill-Score in der Spielertabelle.

**Was zu tun:**
- Im Skill-Kategorien-Modal (`openSkillKatModal`) zwei Felder ergänzen:
  - `skill_key` → Dropdown: `speed / attack / bonus / shoot / skill / pass / def`
  - `max_value` → Zahlenfeld (z.B. 120 für Schuss km/h, 10 für Weitsprung m)
- Laden, anzeigen und speichern in Firestore (`skill_categories/{id}`)
- Danach: bestehende Kategorien in der App einmalig befüllen (Datenpflege)

---

## 🟡 v1.7.x – Weitere offene Punkte

### Spieler-Uploads / Trainer-Review
- Spieler reicht Heimwert ein (z.B. Zu Hause Schussgeschwindigkeit gemessen)
- Trainer sieht Einreichung, kann genehmigen oder ablehnen
- Neue Firestore-Collection: `submissions/{id}` (player_id, measurement_type_id, value, source, status: pending/approved/rejected, session_id)
- Status-Flow: pending → approved (Wert wird in measurements übernommen) / rejected

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
