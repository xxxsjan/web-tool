import { defineEventHandler } from 'h3';
import {
  FISH_AUDIO_VOICES,
  sortFishAudioVoices,
} from '~/utils/fish-audio-tts';

/** 返回内置示例音色（无需 API Key）。更多音色可在 fish.audio 音色库复制 ID。 */
export default defineEventHandler(() => {
  return {
    voices: sortFishAudioVoices(FISH_AUDIO_VOICES),
  };
});
