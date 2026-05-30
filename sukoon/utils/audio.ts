// expo-av is not available in Expo Go (SDK 53+). All calls are no-ops in that environment.

let Audio: any = null;
try {
  Audio = require('expo-av').Audio;
} catch (_) {}

class AudioService {
  private ambientSound: any = null;
  private currentThemeId: string | null = null;
  private chimeSound: any = null;

  async loadThemeAudio(themeId: string) {
    if (!Audio) return;
    if (this.currentThemeId === themeId && this.ambientSound) return;

    await this.unloadAll();
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_3489839ebf.mp3?filename=soft-rain-ambient-111154.mp3' },
        { shouldPlay: false, isLooping: true, volume: 0.3 }
      );
      this.ambientSound = sound;
      this.currentThemeId = themeId;
    } catch (e) {
      console.warn('Failed to load ambient audio', e);
    }
  }

  async playAmbientSound(volume: number = 0.3) {
    if (!this.ambientSound) return;
    try {
      await this.ambientSound.setVolumeAsync(volume);
      await this.ambientSound.playAsync();
    } catch (e) {}
  }

  async playChime() {
    if (!Audio) return;
    try {
      if (!this.chimeSound) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=tibetan-singing-bowl-1-43575.mp3' },
          { shouldPlay: false, volume: 0.8 }
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
        const vol = status.volume;
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
