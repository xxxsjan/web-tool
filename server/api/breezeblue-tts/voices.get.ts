import { defineEventHandler } from 'h3';
import {
  BREEZEBLUE_VOICES,
  sortBreezeBlueVoices,
} from '~/utils/breezeblue-tts';

/** 返回页面内置的大肥鱼等默认音色（无需 API Key）。 */
export default defineEventHandler(() => {
  return {
    voices: sortBreezeBlueVoices(BREEZEBLUE_VOICES),
  };
});
