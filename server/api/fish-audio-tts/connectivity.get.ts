import { defineEventHandler } from 'h3';
import { checkFishAudioConnectivity } from '../../utils/fish-audio-connectivity';

/** 检测本机到 Fish Audio API 的连通性（不消耗合成额度）。 */
export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const apiBase = String(config.fishApiBase || '').trim();
  return checkFishAudioConnectivity({ apiBase });
});
