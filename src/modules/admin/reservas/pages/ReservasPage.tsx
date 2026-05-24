import { useEffect } from 'react'
import ReservasModule from '../../../../components/admin/ReservasModule';
import { useStore } from '../../../../store';
import { useAdminStore } from '../../../../store/adminStore';
import { THEME_PRESETS, ThemeType } from '../../../../types';

export default function ReservasPage() {
  const settings = useStore((state) => state.settings);
  const theme = (settings?.theme || 'moderno') as ThemeType;
  const themeColors = THEME_PRESETS[theme] ?? THEME_PRESETS.moderno;
  const isEjecutivo = theme === 'ejecutivo';
  
  const reservas = useAdminStore(state => state.reservas)
  const fetchReservas = useAdminStore(state => state.fetchReservas)
  const updateReserva = useAdminStore(state => state.updateReserva)
  const deleteReserva = useAdminStore(state => state.deleteReserva)
  
  useEffect(() => {
    fetchReservas(true)
  }, [fetchReservas])
  
  return (
    <ReservasModule 
      themeColors={themeColors} 
      isEjecutivo={isEjecutivo} 
      reservas={reservas}
      onUpdateReserva={updateReserva}
      onDeleteReserva={deleteReserva}
    />
  );
}
