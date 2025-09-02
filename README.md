# Marsica Padel League

Una piattaforma completa per la gestione di leghe di padel con autenticazione, classifiche, statistiche e prenotazioni.

## 🚀 Funzionalità Principali

### 🔐 Sistema di Autenticazione
- **Login obbligatorio** al primo accesso
- **Autenticazione multipla**:
  - Google OAuth
  - Facebook OAuth  
  - Magic Link via email
- **Profilo obbligatorio** con:
  - Email (automatica)
  - Nome (obbligatorio)
  - Cognome (opzionale)
  - Numero di telefono (obbligatorio)

### 🏆 Gestione League
- Sistema di ranking con algoritmo RPA (Rating Performance Algorithm)
- Classifica giocatori in tempo reale
- Statistiche dettagliate per giocatore
- Creazione e gestione partite

### 📱 Modalità Club
- Gestione giocatori avanzata
- Creazione partite
- Sistema di prenotazione campi
- Import/Export dati
- Gestione tornei (in sviluppo)

### ☁️ Sincronizzazione Cloud
- Database Firebase Firestore
- Sincronizzazione real-time
- Backup automatico
- Accesso multi-dispositivo

## 🛠️ Tecnologie Utilizzate

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **Charts**: Recharts
- **Export**: html-to-image per screenshot

## 📦 Installazione

```bash
# Clona il repository
git clone [repository-url]

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev

# Build per produzione
npm run build
```

## ⚙️ Configurazione

### Firebase Setup
1. Crea un progetto Firebase
2. Abilita Authentication (Google, Facebook, Email Link)
3. Crea un database Firestore
4. Configura le variabili d'ambiente:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Regole Firestore
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Leghe accessibili solo agli utenti autenticati
    match /leagues/{leagueId} {
      allow read, write: if request.auth != null;
    }
    
    // Profili utente accessibili solo al proprietario
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🔑 Flusso di Autenticazione

1. **Accesso iniziale**: L'utente vede sempre la pagina di login
2. **Metodi di login**:
   - Google: OAuth con redirect
   - Facebook: OAuth con redirect
   - Email: Magic link inviato via email
3. **Completamento profilo**: Dopo il login, viene richiesto nome e telefono
4. **Accesso all'app**: Solo dopo aver completato il profilo

## 📱 Struttura del Progetto

```
src/
├── app/                    # App principale
├── components/ui/          # Componenti UI riutilizzabili
├── features/              # Moduli funzionali
│   ├── auth/              # Autenticazione
│   ├── classifica/        # Classifiche
│   ├── crea/              # Creazione partite
│   ├── players/           # Gestione giocatori
│   ├── prenota/           # Prenotazioni
│   ├── profile/           # Profilo utente
│   ├── stats/             # Statistiche
│   └── tornei/            # Tornei
├── lib/                   # Utilità e algoritmi
├── services/              # Servizi esterni (Firebase)
└── data/                  # Dati e configurazioni
```

## 🎨 Temi e UI

- **Tema scuro/chiaro** con switch dinamico
- **Design responsive** mobile-first
- **Componenti modulari** e riutilizzabili
- **Icone e animazioni** per UX fluida

## 📊 Sistema di Ranking

L'app utilizza un algoritmo RPA personalizzato che considera:
- Risultato della partita (vittoria/sconfitta)
- Differenza di rating tra giocatori
- Set vinti e persi
- Fattore di aggiustamento dinamico

## 🔧 Development

```bash
# Avvia in modalità sviluppo
npm run dev

# Controlla errori
npm run lint

# Build per produzione
npm run build

# Anteprima build
npm run preview
```

## 📱 PWA Ready

L'app è configurata per essere installabile come Progressive Web App con:
- Service worker per cache offline
- Manifest per installazione mobile
- Icons per diverse risoluzioni

## 🛡️ Sicurezza

- Autenticazione Firebase sicura
- Regole Firestore restrictive
- Validazione input lato client e server
- Sanitizzazione dati utente
- Rate limiting su operazioni critiche

## 📝 TODO / Roadmap

- [ ] Sistema tornei completo
- [ ] Notifiche push
- [ ] Chat integrata
- [ ] Pagamenti integrati
- [ ] App mobile nativa
- [ ] Dashboard admin avanzata

## 👥 Contributi

Per contribuire al progetto:
1. Fork del repository
2. Crea un branch per la tua feature
3. Commit delle modifiche
4. Push del branch
5. Apri una Pull Request

## 📄 Licenza

[Specificate la licenza del progetto]

---

Sviluppato con ❤️ per la comunità del padel
