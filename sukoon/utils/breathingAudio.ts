// Breathing phase audio utility
// Plays soft tones during breathing phase transitions using expo-av

let Audio: any = null;
try {
  Audio = require('expo-av').Audio;
} catch (_) {}

// Free CC0 audio URLs from Pixabay
const SOUNDS = {
  inhale: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_d5866ddf00.mp3', // soft bell
  exhale: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3', // singing bowl
  complete: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3', // singing bowl
};

class BreathingAudioService {
  private inhaleSound: any = null;
  private exhaleSound: any = null;
  private ambientSound: any = null;
  private loaded = false;

  async loadSounds() {
    if (!Audio || this.loaded) return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound: inhale } = await Audio.Sound.createAsync(
        { uri: SOUNDS.inhale },
        { shouldPlay: false, volume: 0.4 }
      );
      this.inhaleSound = inhale;

      const { sound: exhale } = await Audio.Sound.createAsync(
        { uri: SOUNDS.exhale },
        { shouldPlay: false, volume: 0.3 }
      );
      this.exhaleSound = exhale;

      // Ambient drone for breathing sessions
      const { sound: ambient } = await Audio.Sound.createAsync(
        { uri: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c25ca4ff.mp3' },
        { shouldPlay: false, volume: 0.15, isLooping: true }
      );
      this.ambientSound = ambient;

      this.loaded = true;
    } catch (e) {
      console.warn('BreathingAudio: failed to load sounds', e);
    }
  }

  async playPhaseSound(phaseType: string) {
    if (!this.loaded) return;
    try {
      if (phaseType.includes('inhale')) {
        if (this.inhaleSound) {
          await this.inhaleSound.setPositionAsync(0);
          await this.inhaleSound.playAsync();
        }
      } else if (phaseType.includes('exhale') || phaseType.includes('hum')) {
        if (this.exhaleSound) {
          await this.exhaleSound.setPositionAsync(0);
          await this.exhaleSound.playAsync();
        }
      }
    } catch (_) {}
  }

  async startAmbient() {
    if (!this.ambientSound) return;
    try {
      await this.ambientSound.setPositionAsync(0);
      await this.ambientSound.playAsync();
    } catch (_) {}
  }

  async stopAmbient() {
    if (!this.ambientSound) return;
    try {
      await this.ambientSound.pauseAsync();
    } catch (_) {}
  }

  async unloadAll() {
    try { if (this.inhaleSound) { await this.inhaleSound.unloadAsync(); this.inhaleSound = null; } } catch (_) {}
    try { if (this.exhaleSound) { await this.exhaleSound.unloadAsync(); this.exhaleSound = null; } } catch (_) {}
    try { if (this.ambientSound) { await this.ambientSound.unloadAsync(); this.ambientSound = null; } } catch (_) {}
    this.loaded = false;
  }
}

export const breathingAudio = new BreathingAudioService();
