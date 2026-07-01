/**
 * Medical Panel Service
 *
 * Este servicio usa PostgreSQL como base de datos PRINCIPAL.
 * Wix queda como fallback secundario en caso de fallo.
 */

import axios, { AxiosInstance } from 'axios';
import postgresService from './postgres.service';

interface PatientStats {
  programadosHoy: number;
  atendidosHoy: number;
  restantesHoy: number;
}

interface Patient {
  _id: string;
  nombres: string;
  primerNombre: string;
  primerApellido: string;
  numeroId: string;
  estado: string;
  foto: string;
  celular: string;
  fechaAtencion: Date;
  empresaListado: string;
  pvEstado?: string;
  segundoNombre?: string;
  segundoApellido?: string;
  medico?: string;
  motivoConsulta?: string;
  tipoExamen?: string;
  tipoConsulta?: 'virtual' | 'presencial';
}

/**
 * Determina si una consulta es presencial basándose en el código del médico
 * Las consultas presenciales tienen la palabra "PRESENCIAL" en el campo medico
 */
const isPresencialConsulta = (medicoCode: string): boolean => {
  return medicoCode.toUpperCase().includes('PRESENCIAL');
};

interface PaginatedPatients {
  patients: Patient[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface PatientDetails extends Patient {
  email?: string;
  direccion?: string;
  ciudad?: string;
  fechaNacimiento?: Date;
  genero?: string;
  fechaConsulta?: Date;
  diagnostico?: string;
  tratamiento?: string;
}

/**
 * Calcula el inicio y fin del día en Colombia (UTC-5)
 */
function getColombiaDateRange(): { startOfDay: Date; endOfDay: Date } {
  const now = new Date();
  const colombiaTime = new Date(now.getTime() - (5 * 60 * 60 * 1000)); // UTC-5

  const year = colombiaTime.getUTCFullYear();
  const month = colombiaTime.getUTCMonth();
  const day = colombiaTime.getUTCDate();

  // 00:00 Colombia = 05:00 UTC
  const startOfDay = new Date(Date.UTC(year, month, day, 5, 0, 0, 0));
  // 23:59:59 Colombia = 04:59:59 UTC del día siguiente
  const endOfDay = new Date(Date.UTC(year, month, day + 1, 4, 59, 59, 999));

  return { startOfDay, endOfDay };
}

class MedicalPanelService {
  private wixClient: AxiosInstance;
  private wixBaseUrl: string;

  constructor() {
    this.wixBaseUrl = process.env.WIX_FUNCTIONS_URL || 'https://www.bsl.com.co/_functions';

    this.wixClient = axios.create({
      baseURL: this.wixBaseUrl,
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('🔗 Medical Panel Service - PostgreSQL PRIMARY, Wix FALLBACK');
  }

  /**
   * Obtiene las estadísticas del día para un médico específico
   * FUENTE: PostgreSQL (principal) → Wix (fallback)
   */
  async getDailyStats(medicoCode: string): Promise<PatientStats> {
    try {
      // Intentar con PostgreSQL primero
      const stats = await this.getDailyStatsFromPostgres(medicoCode);
      if (stats) {
        console.log(`📊 [PostgreSQL] Estadísticas obtenidas para ${medicoCode}`);
        return stats;
      }
    } catch (error) {
      console.warn('⚠️  [PostgreSQL] Error en getDailyStats, usando Wix fallback:', error);
    }

    // Fallback a Wix
    return this.getDailyStatsFromWix(medicoCode);
  }

  /**
   * Obtiene estadísticas desde PostgreSQL
   */
  private async getDailyStatsFromPostgres(medicoCode: string): Promise<PatientStats | null> {
    const { startOfDay, endOfDay } = getColombiaDateRange();

    const [programados, atendidos, restantes] = await Promise.all([
      // Programados hoy
      postgresService.query(
        `SELECT COUNT(*) as count FROM "HistoriaClinica"
         WHERE "medico" = $1 AND "fechaAtencion" >= $2 AND "fechaAtencion" <= $3`,
        [medicoCode, startOfDay, endOfDay]
      ),
      // Atendidos hoy = Programados hoy que ya tienen fechaConsulta
      postgresService.query(
        `SELECT COUNT(*) as count FROM "HistoriaClinica"
         WHERE "medico" = $1 AND "fechaAtencion" >= $2 AND "fechaAtencion" <= $3
         AND "fechaConsulta" IS NOT NULL`,
        [medicoCode, startOfDay, endOfDay]
      ),
      // Restantes hoy (programados sin fechaConsulta)
      postgresService.query(
        `SELECT COUNT(*) as count FROM "HistoriaClinica"
         WHERE "medico" = $1 AND "fechaAtencion" >= $2 AND "fechaAtencion" <= $3
         AND "fechaConsulta" IS NULL`,
        [medicoCode, startOfDay, endOfDay]
      )
    ]);

    if (!programados || !atendidos || !restantes) {
      return null;
    }

    return {
      programadosHoy: parseInt(programados[0]?.count || '0'),
      atendidosHoy: parseInt(atendidos[0]?.count || '0'),
      restantesHoy: parseInt(restantes[0]?.count || '0')
    };
  }

  /**
   * Fallback: Obtiene estadísticas desde Wix
   */
  private async getDailyStatsFromWix(medicoCode: string): Promise<PatientStats> {
    try {
      const response = await this.wixClient.get(`/estadisticasMedico`, {
        params: { medicoCode }
      });
      console.log(`📊 [Wix Fallback] Estadísticas obtenidas para ${medicoCode}`);
      return response.data;
    } catch (error) {
      console.error('❌ [Wix] Error obteniendo estadísticas:', error);
      return {
        programadosHoy: 0,
        atendidosHoy: 0,
        restantesHoy: 0
      };
    }
  }

  /**
   * Obtiene lista paginada de pacientes pendientes del día
   * FUENTE: PostgreSQL (principal) → Wix (fallback)
   */
  async getPendingPatients(
    medicoCode: string,
    page: number = 0,
    pageSize: number = 10
  ): Promise<PaginatedPatients> {
    try {
      // Intentar con PostgreSQL primero
      const patients = await this.getPendingPatientsFromPostgres(medicoCode, page, pageSize);
      if (patients) {
        console.log(`👥 [PostgreSQL] ${patients.totalItems} pacientes pendientes para ${medicoCode}`);
        return patients;
      }
    } catch (error) {
      console.warn('⚠️  [PostgreSQL] Error en getPendingPatients, usando Wix fallback:', error);
    }

    // Fallback a Wix
    return this.getPendingPatientsFromWix(medicoCode, page, pageSize);
  }

  /**
   * Obtiene pacientes pendientes desde PostgreSQL
   */
  private async getPendingPatientsFromPostgres(
    medicoCode: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedPatients | null> {
    const { startOfDay, endOfDay } = getColombiaDateRange();
    const offset = page * pageSize;

    // Query para obtener pacientes pendientes
    const patientsResult = await postgresService.query(
      `SELECT "_id", "numeroId", "primerNombre", "segundoNombre", "primerApellido", "segundoApellido",
              "celular", "fechaAtencion", "fechaConsulta", "atendido", "pvEstado",
              "codEmpresa", "empresa", "medico", "motivoConsulta", "tipoExamen"
       FROM "HistoriaClinica"
       WHERE "medico" = $1
       AND "fechaAtencion" >= $2
       AND "fechaAtencion" <= $3
       AND "fechaConsulta" IS NULL
       AND "numeroId" NOT IN ('TEST', 'test')
       ORDER BY "fechaAtencion" ASC
       LIMIT $4 OFFSET $5`,
      [medicoCode, startOfDay, endOfDay, pageSize, offset]
    );

    if (!patientsResult) {
      return null;
    }

    // Query para contar total
    const countResult = await postgresService.query(
      `SELECT COUNT(*) as count FROM "HistoriaClinica"
       WHERE "medico" = $1
       AND "fechaAtencion" >= $2
       AND "fechaAtencion" <= $3
       AND "fechaConsulta" IS NULL
       AND "numeroId" NOT IN ('TEST', 'test')`,
      [medicoCode, startOfDay, endOfDay]
    );

    const totalItems = parseInt(countResult?.[0]?.count || '0');
    const totalPages = Math.ceil(totalItems / pageSize);
    const tipoConsulta = isPresencialConsulta(medicoCode) ? 'presencial' : 'virtual';

    const patients: Patient[] = patientsResult.map((row: any) => ({
      _id: row._id,
      nombres: `${row.primerNombre} ${row.primerApellido}`,
      primerNombre: row.primerNombre,
      segundoNombre: row.segundoNombre || '',
      primerApellido: row.primerApellido,
      segundoApellido: row.segundoApellido || '',
      numeroId: row.numeroId,
      estado: row.atendido || 'Pendiente',
      pvEstado: row.pvEstado || '',
      foto: '', // TODO: Obtener de tabla FORMULARIO si es necesario
      celular: row.celular,
      fechaAtencion: row.fechaAtencion,
      empresaListado: row.codEmpresa || row.empresa || 'SIN EMPRESA',
      medico: row.medico,
      motivoConsulta: row.motivoConsulta || '',
      tipoExamen: row.tipoExamen || '',
      tipoConsulta
    }));

    return {
      patients,
      currentPage: page,
      totalPages,
      totalItems
    };
  }

  /**
   * Fallback: Obtiene pacientes pendientes desde Wix
   */
  private async getPendingPatientsFromWix(
    medicoCode: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedPatients> {
    try {
      const response = await this.wixClient.get(`/pacientesPendientes`, {
        params: {
          medicoCode,
          page: page.toString(),
          pageSize: pageSize.toString()
        }
      });

      const tipoConsulta = isPresencialConsulta(medicoCode) ? 'presencial' : 'virtual';
      const patientsWithType = response.data.patients.map((patient: Patient) => ({
        ...patient,
        tipoConsulta
      }));

      console.log(`👥 [Wix Fallback] ${response.data.totalItems} pacientes pendientes para ${medicoCode}`);
      return {
        ...response.data,
        patients: patientsWithType
      };
    } catch (error) {
      console.error('❌ [Wix] Error obteniendo pacientes pendientes:', error);
      return {
        patients: [],
        currentPage: page,
        totalPages: 0,
        totalItems: 0
      };
    }
  }

  /**
   * Busca un paciente por documento de identidad o celular
   * FUENTE: PostgreSQL (principal) → Wix (fallback)
   */
  async searchPatientByDocument(searchTerm: string): Promise<Patient[]> {
    try {
      // Intentar con PostgreSQL primero
      const patients = await this.searchPatientFromPostgres(searchTerm);
      if (patients.length > 0) {
        console.log(`🔍 [PostgreSQL] ${patients.length} registro(s) encontrado(s): ${searchTerm}`);
        return patients;
      }
    } catch (error) {
      console.warn('⚠️  [PostgreSQL] Error en searchPatient, usando Wix fallback:', error);
    }

    // Fallback a Wix
    return this.searchPatientFromWix(searchTerm);
  }

  /**
   * Busca paciente en PostgreSQL
   */
  private async searchPatientFromPostgres(searchTerm: string): Promise<Patient[]> {
    // Devuelve TODOS los registros activos (deleted_at IS NULL) de un mismo
    // paciente, del más reciente al más antiguo. Los sin fecha van al final.
    const result = await postgresService.query(
      `SELECT "_id", "numeroId", "primerNombre", "segundoNombre", "primerApellido", "segundoApellido",
              "celular", "fechaAtencion", "fechaConsulta", "atendido", "pvEstado",
              "codEmpresa", "empresa", "medico", "motivoConsulta", "tipoExamen"
       FROM "HistoriaClinica"
       WHERE ("numeroId" = $1 OR "celular" = $1)
       AND deleted_at IS NULL
       ORDER BY "fechaAtencion" DESC NULLS LAST
       LIMIT 50`,
      [searchTerm]
    );

    if (!result || result.length === 0) {
      return [];
    }

    return result.map((row: any) => ({
      _id: row._id,
      nombres: `${row.primerNombre} ${row.primerApellido}`,
      primerNombre: row.primerNombre,
      segundoNombre: row.segundoNombre || '',
      primerApellido: row.primerApellido,
      segundoApellido: row.segundoApellido || '',
      numeroId: row.numeroId,
      estado: row.atendido || 'Pendiente',
      pvEstado: row.pvEstado || '',
      foto: '',
      celular: row.celular,
      fechaAtencion: row.fechaAtencion,
      empresaListado: row.codEmpresa || row.empresa || 'SIN EMPRESA',
      medico: row.medico,
      motivoConsulta: row.motivoConsulta || '',
      tipoExamen: row.tipoExamen || ''
    }));
  }

  /**
   * Fallback: Busca paciente en Wix
   */
  private async searchPatientFromWix(searchTerm: string): Promise<Patient[]> {
    try {
      const response = await this.wixClient.get(`/buscarPaciente`, {
        params: { searchTerm }
      });
      console.log(`🔍 [Wix Fallback] Búsqueda completada: ${searchTerm}`);
      const patient = response.data.patient || null;
      return patient ? [patient] : [];
    } catch (error) {
      console.error('❌ [Wix] Error buscando paciente:', error);
      return [];
    }
  }

  /**
   * Marca un paciente como "No Contesta"
   * FUENTE: PostgreSQL (principal) + Wix (sincronización)
   */
  async markPatientAsNoAnswer(patientId: string): Promise<boolean> {
    let postgresSuccess = false;
    let wixSuccess = false;

    // Actualizar en PostgreSQL
    try {
      const result = await postgresService.query(
        `UPDATE "HistoriaClinica"
         SET "pvEstado" = 'No Contesta', "medico" = 'RESERVA', "_updatedDate" = NOW()
         WHERE "_id" = $1
         RETURNING "_id"`,
        [patientId]
      );
      postgresSuccess = result !== null && result.length > 0;
      if (postgresSuccess) {
        console.log(`✅ [PostgreSQL] Paciente marcado como No Contesta: ${patientId}`);
      }
    } catch (error) {
      console.error('❌ [PostgreSQL] Error marcando No Contesta:', error);
    }

    // Sincronizar con Wix
    try {
      await this.wixClient.post(`/marcarNoContesta`, { patientId });
      wixSuccess = true;
      console.log(`✅ [Wix] Paciente sincronizado como No Contesta: ${patientId}`);
    } catch (error) {
      console.warn('⚠️  [Wix] Error sincronizando No Contesta (no crítico):', error);
    }

    return postgresSuccess || wixSuccess;
  }

  /**
   * Obtiene detalles completos de un paciente
   * FUENTE: PostgreSQL (principal) → Wix (fallback)
   */
  async getPatientDetails(documento: string): Promise<PatientDetails | null> {
    try {
      // Intentar con PostgreSQL primero
      const details = await this.getPatientDetailsFromPostgres(documento);
      if (details) {
        console.log(`📋 [PostgreSQL] Detalles obtenidos: ${documento}`);
        return details;
      }
    } catch (error) {
      console.warn('⚠️  [PostgreSQL] Error en getPatientDetails, usando Wix fallback:', error);
    }

    // Fallback a Wix
    return this.getPatientDetailsFromWix(documento);
  }

  /**
   * Obtiene detalles del paciente desde PostgreSQL
   */
  private async getPatientDetailsFromPostgres(documento: string): Promise<PatientDetails | null> {
    const result = await postgresService.query(
      `SELECT * FROM "HistoriaClinica" WHERE "numeroId" = $1 ORDER BY "fechaAtencion" DESC LIMIT 1`,
      [documento]
    );

    if (!result || result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      _id: row._id,
      nombres: `${row.primerNombre} ${row.primerApellido}`,
      primerNombre: row.primerNombre,
      segundoNombre: row.segundoNombre || '',
      primerApellido: row.primerApellido,
      segundoApellido: row.segundoApellido || '',
      numeroId: row.numeroId,
      estado: row.atendido || 'Pendiente',
      pvEstado: row.pvEstado || '',
      foto: '',
      celular: row.celular,
      fechaAtencion: row.fechaAtencion,
      fechaConsulta: row.fechaConsulta,
      empresaListado: row.codEmpresa || row.empresa || 'SIN EMPRESA',
      medico: row.medico,
      motivoConsulta: row.motivoConsulta || '',
      tipoExamen: row.tipoExamen || '',
      email: row.email || '',
      diagnostico: row.diagnostico || '',
      tratamiento: row.tratamiento || ''
    };
  }

  /**
   * Fallback: Obtiene detalles del paciente desde Wix
   */
  private async getPatientDetailsFromWix(documento: string): Promise<PatientDetails | null> {
    try {
      const response = await this.wixClient.get(`/detallesPaciente`, {
        params: { documento }
      });
      console.log(`📋 [Wix Fallback] Detalles obtenidos: ${documento}`);
      return response.data.details || null;
    } catch (error) {
      console.error('❌ [Wix] Error obteniendo detalles del paciente:', error);
      return null;
    }
  }

  /**
   * Genera un nombre de sala para videollamada
   */
  generateRoomName(_medicoCode: string, _patientId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `consulta-${timestamp}-${random}`;
  }

  /**
   * Formatea número telefónico con prefijo internacional
   */
  formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[\s\(\)\+\-]/g, '');

    if (cleaned.startsWith('57') && cleaned.length >= 10) {
      return '+' + cleaned;
    }

    if (cleaned.length === 10 && cleaned.startsWith('3')) {
      return '+57' + cleaned;
    }

    const countryCodes = ['1', '52', '54', '55', '34', '44', '49', '33'];
    for (const code of countryCodes) {
      if (cleaned.startsWith(code)) {
        return '+' + cleaned;
      }
    }

    return '+57' + cleaned;
  }
}

export default new MedicalPanelService();
