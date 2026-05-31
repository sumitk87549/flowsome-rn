// expo-av is not available in Expo Go (SDK 53+). All calls are no-ops in that environment.

let Audio: any = null;
try {
  Audio = require('expo-av').Audio;
} catch (_) {}

// Per-theme ambient sound URLs (free CC0 from Pixabay)
const THEME_AUDIO_URLS: Record<string, string> = {
  ganga: 'https://cdn.pixabay.com/download/audio/2022/02/23/audio_ea70ad08e0.mp3',      // river water
  rajasthan: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c25ca4ff.mp3',   // wind ambient
  kerala: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_3489839ebf.mp3',       // rain
  himalaya: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c25ca4ff.mp3',     // wind
  mysore: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c25ca4ff.mp3',       // night ambient
  coorg: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_3489839ebf.mp3',        // forest rain
  mumbai: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_3489839ebf.mp3',       // city rain
  spiti: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c25ca4ff.mp3',        // deep silence
};

const CHIME_URL = 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3';
const DEFAULT_AMBIENT = 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_3489839ebf.mp3';

class AudioService {
  private ambientSound: any = null;
  private currentThemeId: string | null = null;
  private chimeSound: any = null;
  private volume: number = 0.3;

  async loadThemeAudio(themeId: string) {
    if (!Audio) return;
    if (this.currentThemeId === themeId && this.ambientSound) return;

    await this.unloadAll();

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch (_) {}

    const url = THEME_AUDIO_URLS[themeId] || DEFAULT_AMBIENT;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false, isLooping: true, volume: this.volume }
      );
      this.ambientSound = sound;
      this.currentThemeId = themeId;
    } catch (e) {
      console.warn('Failed to load ambient audio', e);
    }
  }

  async playAmbientSound(volume: number = 0.3) {
    this.volume = volume;
    if (!this.ambientSound) return;
    try {
      await this.ambientSound.setVolumeAsync(volume);
      await this.ambientSound.playAsync();
    } catch (e) {}
  }

  async setVolume(volume: number) {
    this.volume = volume;
    if (!this.ambientSound) return;
    try {
      await this.ambientSound.setVolumeAsync(volume);
    } catch (e) {}
  }

  async playChime() {
    if (!Audio) return;
    try {
      if (!this.chimeSound) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: CHIME_URL },
          { shouldPlay: false, volume: 0.6 }
        );
        this.chimeSound = sound;
      }
      await this.chimeSound.setPositionAsync(0);
      await this.chimeSound.playAsync();
    } catch (e) {}
  }

  async fadeAudioOut(duration: number = 1000) {
    if (!this.ambientSound) return;
    try {
      const status = await this.ambientSound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        const steps = 10;
        const stepTime = duration / steps;
        const vol = status.volume || this.volume;
        for (let i = 1; i <= steps; i++) {
          await this.ambientSound.setVolumeAsync(Math.max(0, vol - (vol * (i / steps))));
          await new Promise(r => setTimeout(r, stepTime));
        }
        await this.ambientSound.pauseAsync();
      }
    } catch (e) {}
  }

  async unloadAll() {
    try { if (this.ambientSound) { await this.ambientSound.unloadAsync(); this.ambientSound = null; } } catch (_) {}
    try { if (this.chimeSound) { await this.chimeSound.unloadAsync(); this.chimeSound = null; } } catch (_) {}
    this.currentThemeId = null;
  }
}

export const audioManager = new AudioService();
