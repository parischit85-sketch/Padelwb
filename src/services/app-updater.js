// =============================================
// FILE: src/services/app-updater.js
// Servizio per gestire aggiornamenti APK
// =============================================

// Import dinamici per evitare errori di build web
let Capacitor = null;
let notificationService = null;

// Inizializza gli import solo se necessario
const initializeImports = async () => {
  if (typeof window !== 'undefined') {
    try {
      const capacitorModule = await import('@capacitor/core');
      Capacitor = capacitorModule.Capacitor;
      
      const notificationModule = await import('./notifications.js');
      notificationService = notificationModule.default;
    } catch (error) {
      console.warn('AppUpdater: Could not load native modules, running in web mode');
    }
  }
};

class AppUpdaterService {
  constructor() {
    this.currentVersion = '1.1.1'; // Versione attuale dall'app
    this.checkInterval = null;
    this.updateUrl = 'https://api.github.com/repos/parischit85-sketch/Padelwb/releases/latest';
    this.downloadUrl = null;
    this.isNative = false;
    this.initialized = false;
  }

  /**
   * Inizializza il servizio di aggiornamento
   */
  async initialize() {
    if (this.initialized) return;
    
    await initializeImports();
    
    this.isNative = Capacitor ? Capacitor.isNativePlatform() : false;
    this.initialized = true;
    
    if (!this.isNative) {
      console.log('App Updater: Running in web mode, updates not available');
      return;
    }

    console.log('App Updater: Initializing...');
    
    // Controlla aggiornamenti ogni 30 minuti
    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, 30 * 60 * 1000);

    // Controlla subito all'avvio (dopo 5 secondi)
    setTimeout(() => {
      this.checkForUpdates();
    }, 5000);
  }

  /**
   * Controlla se ci sono aggiornamenti disponibili
   */
  async checkForUpdates(silent = true) {
    try {
      console.log('App Updater: Checking for updates...');
      
      const response = await fetch(this.updateUrl);
      const releaseData = await response.json();
      
      const latestVersion = releaseData.tag_name?.replace('v', '') || releaseData.name?.replace('v', '');
      const downloadUrl = releaseData.assets?.find(asset => 
        asset.name.includes('.apk') && asset.name.includes('release')
      )?.browser_download_url;

      if (!latestVersion || !downloadUrl) {
        console.log('App Updater: No valid release found');
        return { hasUpdate: false };
      }

      const hasUpdate = this.isNewerVersion(latestVersion, this.currentVersion);
      
      console.log(`App Updater: Current: ${this.currentVersion}, Latest: ${latestVersion}, Has update: ${hasUpdate}`);
      
      if (hasUpdate) {
        this.downloadUrl = downloadUrl;
        
        if (!silent) {
          // Mostra notifica di aggiornamento disponibile
          await this.notifyUpdateAvailable(latestVersion);
        }
        
        return {
          hasUpdate: true,
          version: latestVersion,
          downloadUrl: downloadUrl,
          releaseNotes: releaseData.body || 'Nuova versione disponibile!'
        };
      }

      return { hasUpdate: false };
    } catch (error) {
      console.error('App Updater: Error checking for updates:', error);
      return { hasUpdate: false };
    }
  }

  /**
   * Confronta due versioni (formato x.y.z)
   */
  isNewerVersion(newVersion, currentVersion) {
    const parseVersion = (v) => v.split('.').map(n => parseInt(n, 10));
    const newV = parseVersion(newVersion);
    const currentV = parseVersion(currentVersion);
    
    for (let i = 0; i < Math.max(newV.length, currentV.length); i++) {
      const newPart = newV[i] || 0;
      const currentPart = currentV[i] || 0;
      
      if (newPart > currentPart) return true;
      if (newPart < currentPart) return false;
    }
    
    return false;
  }

  /**
   * Mostra notifica di aggiornamento disponibile
   */
  async notifyUpdateAvailable(version) {
    if (!this.isNative || !notificationService?.permissionGranted) return;
    
    try {
      await notificationService.scheduleBookingReminder({
        id: 'app_update',
        datetime: new Date(),
        field: ''
      }, 0);
      
      // Usa una notifica personalizzata per l'aggiornamento
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications').catch(() => {
          console.warn('LocalNotifications module not available');
          return { LocalNotifications: null };
        });
        
        if (!LocalNotifications) {
          console.log('LocalNotifications not available, using fallback');
          return;
        }
        
        await LocalNotifications.schedule({
          notifications: [
            {
              title: '🚀 Aggiornamento Disponibile!',
              body: `Nuova versione ${version} dell'app è disponibile. Tocca per scaricare!`,
              id: Date.now(),
              schedule: { at: new Date(Date.now() + 1000) },
              sound: 'default',
              attachments: [],
              actionTypeId: '',
              extra: {
                type: 'app_update',
                version: version,
                action: 'download_update'
              }
            }
          ]
        });
      } catch (importError) {
        console.warn('Could not import LocalNotifications:', importError);
      }
      
      console.log(`App Updater: Update notification sent for version ${version}`);
    } catch (error) {
      console.error('App Updater: Error sending update notification:', error);
    }
  }

  /**
   * Avvia il download dell'APK
   */
  async downloadUpdate() {
    if (!this.isNative) {
      throw new Error('Download aggiornamenti disponibile solo nell\'app mobile');
    }
    
    if (!this.downloadUrl) {
      const updateInfo = await this.checkForUpdates(false);
      if (!updateInfo.hasUpdate) {
        throw new Error('Nessun aggiornamento disponibile');
      }
    }

    try {
      // Su Android, apri il browser per scaricare l'APK
      if (!this.isNative) {
        throw new Error('Download aggiornamenti disponibile solo nell\'app mobile');
      }
      
      const { Browser } = await import('@capacitor/browser').catch(() => {
        throw new Error('Capacitor Browser module not available');
      });
      
      await Browser.open({ url: this.downloadUrl });
      
      console.log('App Updater: Download started');
      return true;
    } catch (error) {
      console.error('App Updater: Error starting download:', error);
      throw error;
    }
  }

  /**
   * Ottieni informazioni sulla versione corrente
   */
  getCurrentVersion() {
    return this.currentVersion;
  }

  /**
   * Ottieni URL di download diretto (per la tab Profilo)
   */
  getDirectDownloadUrl() {
    return 'https://github.com/parischit85-sketch/Padelwb/releases/latest/download/PadelApp-Release.apk';
  }

  /**
   * Ferma il controllo automatico degli aggiornamenti
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Controlla manualmente gli aggiornamenti (per il pulsante nella tab Profilo)
   */
  async checkManually() {
    return await this.checkForUpdates(false);
  }
}

// Esporta singleton
export const appUpdaterService = new AppUpdaterService();
export default appUpdaterService;
