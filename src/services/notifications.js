// =============================================
// FILE: src/services/notifications.js
// Servizio per gestire notifiche locali e push
// =============================================

// Import dinamici per evitare errori di build web
let LocalNotifications = null;
let PushNotifications = null;
let Capacitor = null;

// Inizializza gli import solo se necessario
const initializeImports = async () => {
  if (typeof window !== 'undefined') {
    try {
      const capacitorModule = await import('@capacitor/core');
      Capacitor = capacitorModule.Capacitor;
      
      const localNotificationsModule = await import('@capacitor/local-notifications');
      LocalNotifications = localNotificationsModule.LocalNotifications;
      
      const pushNotificationsModule = await import('@capacitor/push-notifications');
      PushNotifications = pushNotificationsModule.PushNotifications;
    } catch (error) {
      console.warn('Notifications: Could not load native modules, running in web mode');
    }
  }
};

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.permissionGranted = false;
    this.importsReady = false;
  }

  async initialize() {
    if (!this.importsReady) {
      await initializeImports();
      this.importsReady = true;
    }
    
    if (this.isInitialized || !Capacitor?.isNativePlatform()) {
      console.log('Notifications: Skipping - not native platform or already initialized');
      return;
    }

    try {
      console.log('Notifications: Initializing...');
      
      // Prima controlla i permessi esistenti
      const existingLocalPerms = await LocalNotifications.checkPermissions();
      console.log('Existing local permissions:', existingLocalPerms);
      
      // Se non sono già concessi, richiedili
      let localPermission = existingLocalPerms;
      if (existingLocalPerms.display !== 'granted') {
        console.log('Requesting local notifications permissions...');
        localPermission = await LocalNotifications.requestPermissions();
        console.log('Local notifications permission result:', localPermission);
      }

      // Stessa cosa per le push notifications
      const existingPushPerms = await PushNotifications.checkPermissions();
      console.log('Existing push permissions:', existingPushPerms);
      
      let pushPermission = existingPushPerms;
      if (existingPushPerms.receive !== 'granted') {
        console.log('Requesting push notifications permissions...');
        pushPermission = await PushNotifications.requestPermissions();
        console.log('Push notifications permission result:', pushPermission);
      }

      // Aggiorna lo stato dei permessi
      this.permissionGranted = 
        localPermission.display === 'granted' || 
        pushPermission.receive === 'granted';

      console.log('Notifications permissions granted:', this.permissionGranted);

      // Configura listeners per notifiche push
      await this.setupPushListeners();

      // Registra per le notifiche push solo se i permessi sono stati concessi
      if (this.permissionGranted) {
        console.log('Registering for push notifications...');
        await PushNotifications.register();
      }

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Error initializing notifications:', error);
      // Non bloccare l'app per errori di notifiche
      this.isInitialized = true;
      this.permissionGranted = false;
    }
  }

  async setupPushListeners() {
    // Listener per registrazione riuscita
    await PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      // Qui potresti inviare il token al tuo server
    });

    // Listener per errori di registrazione
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Listener per notifiche ricevute
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received: ', notification);
    });

    // Listener per notifiche toccate
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed: ', notification.actionId, notification.inputValue);
    });
  }

  // Invia una notifica locale per promemoria prenotazione
  async scheduleBookingReminder(bookingData, minutesBefore = 30) {
    if (!this.importsReady) await this.initialize();
    
    if (!this.permissionGranted || !LocalNotifications) {
      console.log('Notifications permission not granted or not available');
      return;
    }

    const notificationTime = new Date(bookingData.datetime);
    notificationTime.setMinutes(notificationTime.getMinutes() - minutesBefore);

    // Non programmare notifiche nel passato
    if (notificationTime <= new Date()) {
      console.log('Cannot schedule notification in the past');
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '🏓 Promemoria Prenotazione',
            body: `La tua prenotazione per il ${bookingData.field} è tra ${minutesBefore} minuti!`,
            id: Date.now(),
            schedule: { at: notificationTime },
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: {
              type: 'booking_reminder',
              bookingId: bookingData.id,
            }
          }
        ]
      });

      console.log(`Notification scheduled for ${notificationTime}`);
      return true;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  }

  // Invia notifica immediata per conferma prenotazione
  async sendBookingConfirmation(bookingData) {
    if (!this.importsReady) await this.initialize();
    
    if (!this.permissionGranted || !LocalNotifications) {
      console.log('Notifications permission not granted or not available');
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '✅ Prenotazione Confermata',
            body: `Campo ${bookingData.field} prenotato per ${new Date(bookingData.datetime).toLocaleString('it-IT')}`,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) }, // 1 secondo da ora
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: {
              type: 'booking_confirmed',
              bookingId: bookingData.id,
            }
          }
        ]
      });

      console.log('Booking confirmation notification sent');
      return true;
    } catch (error) {
      console.error('Error sending confirmation notification:', error);
      return false;
    }
  }

  // Invia notifica immediata quando si viene aggiunti a una partita
  async notifyAddedToMatch(matchData, playerName) {
    if (!this.importsReady) await this.initialize();
    
    if (!this.permissionGranted || !LocalNotifications) {
      console.log('Notifications permission not granted or not available');
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '🎾 Aggiunto alla Partita!',
            body: `${playerName}, sei stato aggiunto alla partita di ${matchData.date} alle ${matchData.time}. Campo: ${matchData.field}`,
            id: `added_${matchData.id}_${Date.now()}`,
            schedule: { at: new Date(Date.now() + 1000) }, // 1 secondo da ora
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: {
              type: 'added_to_match',
              matchId: matchData.id,
              action: 'view_match'
            }
          }
        ]
      });

      console.log(`Notifica "aggiunto alla partita" inviata per ${playerName}`);
      return true;
    } catch (error) {
      console.error('Errore nell\'invio della notifica di aggiunta:', error);
      return false;
    }
  }

  // Invia notifica 2 ore prima della partita
  async scheduleMatchReminder(matchData, minutesBefore = 120) {
    if (!this.importsReady) await this.initialize();
    
    if (!this.permissionGranted || !LocalNotifications) {
      console.log('Notifications permission not granted or not available');
      return;
    }

    // Costruisce la data/ora della partita
    const matchDateTime = new Date(`${matchData.date} ${matchData.time}`);
    const notificationTime = new Date(matchDateTime.getTime() - (minutesBefore * 60 * 1000));

    if (notificationTime <= new Date()) {
      console.log('Cannot schedule match reminder in the past');
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '⏰ Partita tra 2 ore!',
            body: `La tua partita inizia alle ${matchData.time} al ${matchData.field}. Preparati! ⚽`,
            id: `reminder_${matchData.id}`,
            schedule: { at: notificationTime },
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: {
              type: 'match_reminder',
              matchId: matchData.id,
              action: 'view_match'
            }
          }
        ]
      });

      console.log(`Promemoria partita programmato per ${notificationTime.toLocaleString('it-IT')} (partita: ${matchData.id})`);
      return true;
    } catch (error) {
      console.error('Errore nella programmazione del promemoria partita:', error);
      return false;
    }
  }

  // Cancella notifiche per una partita specifica
  async cancelMatchNotifications(matchId) {
    if (!this.importsReady) await this.initialize();
    
    if (!LocalNotifications) {
      console.log('LocalNotifications not available');
      return false;
    }
    
    try {
      // Cancella il promemoria della partita
      await LocalNotifications.cancel({
        notifications: [{ id: `reminder_${matchId}` }]
      });

      // Cancella eventuali notifiche di aggiunta (più difficile da tracciare)
      const pending = await LocalNotifications.getPending();
      for (const notification of pending.notifications) {
        if (notification.extra?.matchId === matchId) {
          await LocalNotifications.cancel({
            notifications: [{ id: notification.id }]
          });
        }
      }

      console.log(`Tutte le notifiche per la partita ${matchId} sono state cancellate`);
      return true;
    } catch (error) {
      console.error('Errore nella cancellazione delle notifiche della partita:', error);
      return false;
    }
  }

  // Cancella tutte le notifiche programmate
  async cancelAllNotifications() {
    if (!this.importsReady) await this.initialize();
    
    if (!LocalNotifications) {
      console.log('LocalNotifications not available');
      return;
    }
    
    try {
      await LocalNotifications.cancel({
        notifications: []
      });
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  // Ottieni notifiche in sospeso
  async getPendingNotifications() {
    if (!this.importsReady) await this.initialize();
    
    if (!LocalNotifications) {
      console.log('LocalNotifications not available');
      return [];
    }
    
    try {
      const pending = await LocalNotifications.getPending();
      console.log('Pending notifications:', pending.notifications);
      return pending.notifications;
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  // === FUNZIONI DI TEST PER DEBUG === //
  
  // Controlla solo i permessi senza inizializzare
  async checkPermissions() {
    if (!this.importsReady) await this.initialize();
    
    if (!Capacitor?.isNativePlatform() || !LocalNotifications || !PushNotifications) {
      console.log('Not on native platform or modules not available');
      return false;
    }

    try {
      const localPerms = await LocalNotifications.checkPermissions();
      const pushPerms = await PushNotifications.checkPermissions();
      
      console.log('Local permissions:', localPerms);
      console.log('Push permissions:', pushPerms);
      
      return localPerms.display === 'granted' || pushPerms.receive === 'granted';
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  // Richiede solo i permessi
  async requestPermissions() {
    if (!this.importsReady) await this.initialize();
    
    if (!Capacitor?.isNativePlatform() || !LocalNotifications || !PushNotifications) {
      console.log('Not on native platform or modules not available');
      return false;
    }

    try {
      const localPerms = await LocalNotifications.requestPermissions();
      const pushPerms = await PushNotifications.requestPermissions();
      
      console.log('Requested local permissions:', localPerms);
      console.log('Requested push permissions:', pushPerms);
      
      const granted = localPerms.display === 'granted' || pushPerms.receive === 'granted';
      this.permissionGranted = granted;
      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Invia una notifica di test immediata
  async sendTestNotification() {
    if (!this.importsReady) await this.initialize();
    
    if (!Capacitor?.isNativePlatform() || !LocalNotifications) {
      alert('🧪 Test Notification\n(Solo su dispositivo mobile nativo)');
      return;
    }

    if (!this.permissionGranted) {
      throw new Error('Permessi notifiche non concessi');
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '🧪 Test Notifica',
            body: `Notifica di test inviata alle ${new Date().toLocaleTimeString('it-IT')} ✅`,
            id: `test_${Date.now()}`,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: {
              type: 'test_notification'
            }
          }
        ]
      });

      console.log('Test notification sent');
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  // Programma una notifica di test per tra 10 secondi
  async scheduleTestNotification() {
    if (!this.importsReady) await this.initialize();
    
    if (!Capacitor?.isNativePlatform() || !LocalNotifications) {
      alert('⏰ Test Scheduled Notification\n(Solo su dispositivo mobile nativo)');
      return;
    }

    if (!this.permissionGranted) {
      throw new Error('Permessi notifiche non concessi');
    }

    try {
      const scheduleTime = new Date(Date.now() + 10000); // 10 secondi da ora
      
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '⏰ Test Programmazione',
            body: `Notifica programmata ricevuta! 🎯 Era per le ${scheduleTime.toLocaleTimeString('it-IT')}`,
            id: `scheduled_test_${Date.now()}`,
            schedule: { at: scheduleTime },
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: {
              type: 'scheduled_test'
            }
          }
        ]
      });

      console.log(`Scheduled test notification for ${scheduleTime}`);
      return true;
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      throw error;
    }
  }
}

// Esporta singleton
export const notificationService = new NotificationService();
export default notificationService;

// Funzioni helper esportate per compatibilità
export const checkPermissions = () => notificationService.checkPermissions();
export const requestPermissions = () => notificationService.requestPermissions();
export const sendTestNotification = () => notificationService.sendTestNotification();
export const scheduleTestNotification = () => notificationService.scheduleTestNotification();
