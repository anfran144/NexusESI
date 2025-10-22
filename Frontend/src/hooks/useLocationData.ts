import { useQuery } from '@tanstack/react-query';
import { locationService } from '@/services/location.service';

export const useLocationData = () => {
  // Query para obtener países
  const paisesQuery = useQuery({
    queryKey: ['paises'],
    queryFn: () => locationService.getPaises(),
    staleTime: 1000 * 60 * 30, // 30 minutos
  });

  // Query para obtener estados por país
  const useEstadosByPais = (paisId: number | null) => {
    return useQuery({
      queryKey: ['estados', paisId],
      queryFn: () => locationService.getEstadosByPais(paisId!),
      enabled: !!paisId,
      staleTime: 1000 * 60 * 30, // 30 minutos
    });
  };

  // Query para obtener ciudades por estado
  const useCiudadesByEstado = (estadoId: number | null) => {
    return useQuery({
      queryKey: ['ciudades', estadoId],
      queryFn: () => locationService.getCiudadesByEstado(estadoId!),
      enabled: !!estadoId,
      staleTime: 1000 * 60 * 30, // 30 minutos
    });
  };

  // Query para obtener instituciones por ciudad
  const useInstitucionesByCiudad = (ciudadId: number | null) => {
    return useQuery({
      queryKey: ['instituciones', ciudadId],
      queryFn: () => locationService.getInstitucionesByCiudad(ciudadId!),
      enabled: !!ciudadId,
      staleTime: 1000 * 60 * 15, // 15 minutos (más frecuente para instituciones)
    });
  };

  return {
    paisesQuery,
    useEstadosByPais,
    useCiudadesByEstado,
    useInstitucionesByCiudad,
  };
};