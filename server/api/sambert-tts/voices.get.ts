import { defineEventHandler } from 'h3';
import { SAMBERT_VOICES, sortSambertVoices } from '~/utils/sambert-tts';

export default defineEventHandler(() => {
  return {
    voices: sortSambertVoices(SAMBERT_VOICES),
  };
});
