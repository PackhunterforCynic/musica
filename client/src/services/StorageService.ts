export interface UserPreferences {
  displayName: string;
  preferredAudioInputId: string;
  preferredAudioOutputId: string;
  preferredVideoInputId: string;
  masterVolume: number; // 0 to 1
  soundEffectsEnabled: boolean;
  lastJoinedRoomId: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  displayName: '',
  preferredAudioInputId: 'default',
  preferredAudioOutputId: 'default',
  preferredVideoInputId: 'default',
  masterVolume: 1.0,
  soundEffectsEnabled: true,
  lastJoinedRoomId: '',
};

const PREFS_KEY = 'musica_user_preferences_v1';

class StorageService {
  private prefs: UserPreferences;

  constructor() {
    this.prefs = this.loadPreferences();
  }

  private loadPreferences(): UserPreferences {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(PREFS_KEY);
        if (item) {
          return { ...DEFAULT_PREFERENCES, ...JSON.parse(item) };
        }
      }
    } catch (e) {
      console.warn('[StorageService] Local storage inaccessible, using defaults.');
    }
    return { ...DEFAULT_PREFERENCES };
  }

  public getPreferences(): UserPreferences {
    return { ...this.prefs };
  }

  public savePreferences(newPrefs: Partial<UserPreferences>): UserPreferences {
    this.prefs = { ...this.prefs, ...newPrefs };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(this.prefs));
      }
    } catch (e) {
      console.warn('[StorageService] Could not save preferences to local storage.');
    }
    return this.prefs;
  }
}

export const storageService = new StorageService();
