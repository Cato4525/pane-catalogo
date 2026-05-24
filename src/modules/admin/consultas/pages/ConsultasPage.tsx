import ConsultasModule from '../../../../components/admin/ConsultasModule';
import { useStore } from '../../../../store';
import { THEME_PRESETS, ThemeType } from '../../../../types';

export default function ConsultasPage() {
  const settings = useStore((state) => state.settings);
  const theme = (settings?.theme || 'moderno') as ThemeType;
  const themeColors = THEME_PRESETS[theme] ?? THEME_PRESETS.moderno;
  const isEjecutivo = theme === 'ejecutivo';
  
  return <ConsultasModule themeColors={themeColors} isEjecutivo={isEjecutivo} />;
}
