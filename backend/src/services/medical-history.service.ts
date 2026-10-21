import historiaClinicaPostgresService from './historia-clinica-postgres.service';
import whatsappService from './whatsapp.service';
import postgresService from './postgres.service';

// Destinatario de la alerta SST de OMEGA (WHAPI). Hoy: solo el número terminado en 2543077.
const NOTIF_OMEGA = ['573202543077'];

// Destinatario de la notificación de cierre de HC de SOFTSERVE (WHAPI).
const NOTIF_SOFTSERVE = ['573148887169'];

// Guard en memoria: crear las tablas de trazabilidad una sola vez por proceso.
let tablaAlertasOmegaLista = false;
let tablaSoftserveLista = false;

/** Normaliza un concepto: sin tildes, MAYÚSCULAS, espacios/saltos colapsados, sin punto final. */
function normalizarConcepto(concepto: string): string {
  return concepto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/\.+\s*$/, '')
    .trim();
}

/**
 * "Apto pleno" = APTO/ELEGIBLE del cargo SIN restricciones y SIN recomendaciones. Es el único
 * grupo que NO requiere revisión de SST. En sync con panel-empresas.html de BSL-PLATAFORMA2 y
 * con BSL-CONSULTAVIDEO.
 */
function esConceptoAptoPleno(concepto: string | null | undefined): boolean {
  if (!concepto) return false;
  const c = normalizarConcepto(concepto);
  if (/\bNO\s+(APTO|ELEGIBLE)/.test(c)) return false;
  if (c.includes('INCOMPATIBLE')) return false;
  if (c.includes('PENDIENTE') || c.includes('APLAZADO')) return false;
  if (c.includes('DETERIORO')) return false; // "NO PRESENTA DETERIORO..." (egreso)
  if (c.includes('RESTRICCION') && !c.includes('SIN RESTRICCION')) return false;
  if (c.includes('RECOMENDACION') && !c.includes('SIN RECOMENDACION')) return false;
  return /^(APTO|APTA|ELEGIBLE)\b/.test(c);
}

/**
 * ¿El concepto debe disparar la alerta de revisión de SST (OMEGA)? Alerta en todo lo que NO sea
 * apto pleno (restricciones, con recomendaciones, no apto/no elegible, incompatibles,
 * pendiente/aplazado), EXCEPTO el egreso "no presenta deterioro".
 */
function conceptoRequiereRevisionSst(concepto: string | null | undefined): boolean {
  if (!concepto) return false;
  if (esConceptoAptoPleno(concepto)) return false;
  if (normalizarConcepto(concepto).includes('DETERIORO')) return false;
  return true;
}

// Antecedentes personales (27 campos)
interface AntecedentesPersonales {
  cirugiaOcular?: boolean;
  cirugiaProgramada?: boolean;
  condicionMedica?: boolean;
  dolorCabeza?: boolean;
  dolorEspalda?: boolean;
  embarazo?: boolean;
  enfermedadHigado?: boolean;
  enfermedadPulmonar?: boolean;
  fuma?: boolean;
  consumoLicor?: boolean;
  hernias?: boolean;
  hormigueos?: boolean;
  presionAlta?: boolean;
  problemasAzucar?: boolean;
  problemasCardiacos?: boolean;
  problemasSueno?: boolean;
  usaAnteojos?: boolean;
  usaLentesContacto?: boolean;
  varices?: boolean;
  hepatitis?: boolean;
  trastornoPsicologico?: boolean;
  sintomasPsicologicos?: boolean;
  diagnosticoCancer?: boolean;
  enfermedadesLaborales?: boolean;
  enfermedadOsteomuscular?: boolean;
  enfermedadAutoinmune?: boolean;
  ruidoJaqueca?: boolean;
}

// Antecedentes familiares (8 campos)
interface AntecedentesFamiliares {
  hereditarias?: boolean;
  geneticas?: boolean;
  diabetes?: boolean;
  hipertension?: boolean;
  infartos?: boolean;
  cancer?: boolean;
  trastornos?: boolean;
  infecciosas?: boolean;
}

interface MedicalHistoryData {
  // Datos del paciente
  numeroId: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  celular: string;
  email?: string;
  fechaNacimiento?: Date;
  edad?: number;
  genero?: string;
  estadoCivil?: string;
  hijos?: string;
  ejercicio?: string;

  // Datos de la empresa
  codEmpresa?: string;
  cargo?: string;
  tipoExamen?: string;

  // Encuesta de salud
  encuestaSalud?: string;
  antecedentesFamiliares?: string;
  empresa1?: string;

  // Campos médicos editables
  mdAntecedentes?: string;
  mdObsParaMiDocYa?: string;
  mdObservacionesCertificado?: string;
  mdRecomendacionesMedicasAdicionales?: string;
  mdConceptoFinal?: string;
  mdDx1?: string;
  mdDx2?: string;
  talla?: string;
  peso?: string;

  // Fechas y estado
  fechaAtencion?: Date;
  fechaConsulta?: Date;
  atendido?: string;
  medico?: string;

  // Antecedentes detallados desde formularios
  antecedentesPersonales?: AntecedentesPersonales;
  antecedentesFamiliaresDetalle?: AntecedentesFamiliares;
}

interface UpdateMedicalHistoryPayload {
  historiaId: string;
  mdAntecedentes?: string;
  mdObsParaMiDocYa?: string;
  mdObservacionesCertificado?: string;
  mdRecomendacionesMedicasAdicionales?: string;
  mdConceptoFinal?: string;
  mdDx1?: string;
  mdDx2?: string;
  talla?: string;
  peso?: string;
  cargo?: string;
}

class MedicalHistoryService {

  /**
   * Obtiene la historia clínica de un paciente desde PostgreSQL por _id
   */
  async getMedicalHistory(historiaId: string): Promise<MedicalHistoryData | null> {
    try {
      console.log(`📋 [PostgreSQL] Obteniendo historia clínica para ID: ${historiaId}`);

      const postgresData = await historiaClinicaPostgresService.getById(historiaId);

      if (postgresData) {
        console.log(`✅ [PostgreSQL] Historia clínica encontrada para ${historiaId}`);
        return postgresData as MedicalHistoryData;
      }

      console.warn(`⚠️  [PostgreSQL] No se encontró historia clínica para ${historiaId}`);
      return null;
    } catch (error: any) {
      console.error('❌ [PostgreSQL] Error obteniendo historia clínica:', error.message);
      throw new Error('Error al obtener historia clínica del paciente');
    }
  }

  /**
   * Actualiza la historia clínica de un paciente en PostgreSQL por _id
   */
  async updateMedicalHistory(payload: UpdateMedicalHistoryPayload): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`💾 [PostgreSQL] Actualizando historia clínica para ID: ${payload.historiaId}`);

      // Obtener datos base del paciente
      const historiaBase = await this.getMedicalHistory(payload.historiaId);

      if (!historiaBase) {
        return { success: false, error: 'No se encontró historia clínica' };
      }

      // Actualizar solo los campos médicos editables (no toca empresa, motivoConsulta, etc.)
      const success = await historiaClinicaPostgresService.updateMedicalFields(payload.historiaId, {
        mdAntecedentes: payload.mdAntecedentes,
        mdObsParaMiDocYa: payload.mdObsParaMiDocYa,
        mdObservacionesCertificado: payload.mdObservacionesCertificado,
        mdRecomendacionesMedicasAdicionales: payload.mdRecomendacionesMedicasAdicionales,
        mdConceptoFinal: payload.mdConceptoFinal,
        mdDx1: payload.mdDx1,
        mdDx2: payload.mdDx2,
        talla: payload.talla,
        peso: payload.peso,
        cargo: payload.cargo,
      });

      if (success) {
        console.log(`✅ [PostgreSQL] Historia clínica actualizada exitosamente para ${payload.historiaId}`);

        // Enviar alerta WhatsApp para OMEGA con concepto crítico
        this.sendOmegaAlertIfNeeded(historiaBase, payload);

        // Notificar a SOFTSERVE cada vez que se cierra un examen (una sola vez por orden)
        this.sendSoftserveNotificationIfNeeded(historiaBase, payload);

        return { success: true };
      } else {
        return { success: false, error: 'Error al guardar en PostgreSQL' };
      }
    } catch (error: any) {
      console.error('❌ [PostgreSQL] Error actualizando historia clínica:', error.message);
      return {
        success: false,
        error: error.message || 'Error al actualizar historia clínica'
      };
    }
  }

  /**
   * Envía alerta WhatsApp a SST de OMEGA cuando el concepto requiere revisión (no es "apto pleno").
   *
   * Clasificador robusto (no whitelist exacta): la whitelist vieja ['NO APTO','APLAZADO',
   * 'APTO CON RECOMENDACIONES'] no reconocía las redacciones "médico-laborales" del panel
   * (ej. "Presenta restricciones médico-laborales actualmente incompatibles..."), así que la
   * alerta había dejado de dispararse para OMEGA presencial. En sync con BSL-CONSULTAVIDEO.
   */
  private async sendOmegaAlertIfNeeded(
    historiaBase: MedicalHistoryData,
    payload: UpdateMedicalHistoryPayload
  ): Promise<void> {
    try {
      if (
        historiaBase.codEmpresa?.toUpperCase() !== 'OMEGA' ||
        !conceptoRequiereRevisionSst(payload.mdConceptoFinal)
      ) {
        return;
      }

      const nombrePaciente = [
        historiaBase.primerNombre,
        historiaBase.segundoNombre,
        historiaBase.primerApellido,
        historiaBase.segundoApellido,
      ].filter(Boolean).join(' ');

      let mensaje = `🚨 *ALERTA CONCEPTO MÉDICO - OMEGA*\n\n`;
      mensaje += `*Paciente:* ${nombrePaciente}\n`;
      mensaje += `*Documento:* ${historiaBase.numeroId}\n`;
      mensaje += `*Cargo:* ${payload.cargo || historiaBase.cargo || 'No especificado'}\n`;
      mensaje += `*Concepto Final:* ${payload.mdConceptoFinal}\n`;

      if (payload.mdRecomendacionesMedicasAdicionales) {
        mensaje += `\n*Recomendaciones Médicas:*\n${payload.mdRecomendacionesMedicasAdicionales}\n`;
      }

      if (payload.mdObsParaMiDocYa) {
        mensaje += `\n*Observaciones para la empresa:*\n${payload.mdObsParaMiDocYa}\n`;
      }

      const baseUrl = 'https://presencial.medico-bsl.com';
      const approveUrl = `${baseUrl}/api/medical-panel/approve/${payload.historiaId}/APROBADO`;
      const rejectUrl = `${baseUrl}/api/medical-panel/approve/${payload.historiaId}/NO%20APROBADO`;

      mensaje += `\n---\n`;
      mensaje += `✅ *Aprobar:* ${approveUrl}\n`;
      mensaje += `❌ *No Aprobar:* ${rejectUrl}\n`;

      const telefonos = NOTIF_OMEGA;

      console.log(`🚨 Enviando alerta OMEGA para ${nombrePaciente} - Concepto: ${payload.mdConceptoFinal} - tipo: ${historiaBase.tipoExamen || 'N/A'} → ${telefonos.join(', ')}`);

      const resultados = await Promise.allSettled(
        telefonos.map(telefono => whatsappService.sendTextMessage(telefono, mensaje))
      );

      resultados.forEach((resultado, i) => {
        if (resultado.status === 'fulfilled' && resultado.value.success) {
          console.log(`✅ Alerta OMEGA enviada a ${telefonos[i]}`);
        } else {
          const error = resultado.status === 'rejected' ? resultado.reason : resultado.value.error;
          console.error(`❌ Error enviando alerta OMEGA a ${telefonos[i]}:`, error);
        }
      });

      // Trazabilidad: registrar el envío (enviada / parcial / fallida) para poder auditar y reintentar.
      await this.registrarAlertaOmega(historiaBase, payload, telefonos, resultados);
    } catch (error: any) {
      // No bloquear el guardado si falla el envío de alertas
      console.error('❌ Error enviando alerta OMEGA por WhatsApp:', error.message);
    }
  }

  /**
   * Trazabilidad de la alerta SST de OMEGA: una fila por envío con el resultado por destinatario
   * (enviada / parcial / fallida). La tabla se crea sola la primera vez (misma tabla que usa
   * BSL-CONSULTAVIDEO, en la BD compartida). Best-effort: nunca rompe el guardado ni el envío.
   */
  private async registrarAlertaOmega(
    historiaBase: MedicalHistoryData,
    payload: UpdateMedicalHistoryPayload,
    telefonos: string[],
    resultados: PromiseSettledResult<{ success: boolean; error?: string }>[]
  ): Promise<void> {
    try {
      if (!tablaAlertasOmegaLista) {
        await postgresService.query(`
          CREATE TABLE IF NOT EXISTS omega_alertas_sst (
            id            SERIAL PRIMARY KEY,
            historia_id   TEXT NOT NULL,
            numero_id     TEXT,
            tipo_examen   TEXT,
            concepto      TEXT,
            destinatarios TEXT[],
            estado        TEXT,
            detalle       JSONB,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        // Puede que la tabla ya exista (creada por BSL-CONSULTAVIDEO) sin la columna origen.
        await postgresService.query(`ALTER TABLE omega_alertas_sst ADD COLUMN IF NOT EXISTS origen TEXT`);
        tablaAlertasOmegaLista = true;
      }

      const detalle = telefonos.map((tel, i) => {
        const r = resultados[i];
        const ok = r.status === 'fulfilled' && r.value.success;
        const error = r.status === 'rejected'
          ? String(r.reason)
          : (r.value.success ? null : (r.value.error || 'error desconocido'));
        return { telefono: tel, ok, error };
      });
      const enviados = detalle.filter(d => d.ok).length;
      const estado = enviados === 0 ? 'fallida' : (enviados === telefonos.length ? 'enviada' : 'parcial');

      await postgresService.query(
        `INSERT INTO omega_alertas_sst
           (historia_id, numero_id, tipo_examen, concepto, destinatarios, estado, detalle, origen)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
        [
          payload.historiaId,
          historiaBase.numeroId,
          historiaBase.tipoExamen || null,
          payload.mdConceptoFinal || null,
          telefonos,
          estado,
          JSON.stringify(detalle),
          'presencial',
        ]
      );
      console.log(`🧾 Trazabilidad alerta OMEGA registrada: ${estado} (${enviados}/${telefonos.length})`);
    } catch (error: any) {
      console.error('❌ Error registrando trazabilidad de alerta OMEGA:', error.message);
    }
  }

  /**
   * Notifica a SOFTSERVE cada vez que un médico cierra un examen (guarda el concepto final).
   * Se envía UNA sola vez por orden: candado de idempotencia con PK historia_id en
   * softserve_notificaciones (ON CONFLICT DO NOTHING). Va por WHAPI, es best-effort (nunca rompe
   * el guardado) y se dispara en TODOS los conceptos — como ZIMMER: cada examen manda mensaje,
   * no solo los que requieren revisión.
   */
  private async sendSoftserveNotificationIfNeeded(
    historiaBase: MedicalHistoryData,
    payload: UpdateMedicalHistoryPayload
  ): Promise<void> {
    try {
      // Solo SOFTSERVE, y solo cuando el examen quedó cerrado (hay concepto final).
      if (historiaBase.codEmpresa?.toUpperCase() !== 'SOFTSERVE' || !payload.mdConceptoFinal) {
        return;
      }

      if (!tablaSoftserveLista) {
        await postgresService.query(`
          CREATE TABLE IF NOT EXISTS softserve_notificaciones (
            historia_id   TEXT PRIMARY KEY,
            numero_id     TEXT,
            tipo_examen   TEXT,
            concepto      TEXT,
            destinatarios TEXT[],
            estado        TEXT,
            detalle       JSONB,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        tablaSoftserveLista = true;
      }

      // Candado: solo el primer guardado de esta orden "gana" la notificación.
      const claim = await postgresService.query(
        `INSERT INTO softserve_notificaciones (historia_id, numero_id, tipo_examen, concepto, destinatarios, estado)
         VALUES ($1, $2, $3, $4, $5, 'enviando')
         ON CONFLICT (historia_id) DO NOTHING
         RETURNING historia_id`,
        [
          payload.historiaId,
          historiaBase.numeroId,
          historiaBase.tipoExamen || null,
          payload.mdConceptoFinal || null,
          NOTIF_SOFTSERVE,
        ]
      );
      if (!claim || claim.length === 0) {
        return; // esta orden ya fue notificada
      }

      const nombrePaciente = [
        historiaBase.primerNombre,
        historiaBase.segundoNombre,
        historiaBase.primerApellido,
        historiaBase.segundoApellido,
      ].filter(Boolean).join(' ');

      const certificadoUrl = `https://bsl-utilidades-yp78a.ondigitalocean.app/generar-certificado-desde-wix/${payload.historiaId}`;

      let mensaje = `✅ *HISTORIA CLÍNICA CERRADA - SOFTSERVE*\n\n`;
      mensaje += `*Paciente:* ${nombrePaciente}\n`;
      mensaje += `*Documento:* ${historiaBase.numeroId}\n`;
      mensaje += `*Cargo:* ${payload.cargo || historiaBase.cargo || 'No especificado'}\n`;
      mensaje += `*Tipo de examen:* ${historiaBase.tipoExamen || 'No especificado'}\n`;
      mensaje += `*Concepto Final:* ${payload.mdConceptoFinal}\n`;
      mensaje += `\n*Certificado:*\n${certificadoUrl}\n`;

      const telefonos = NOTIF_SOFTSERVE;
      console.log(`📋 Notificando cierre de HC SOFTSERVE para ${nombrePaciente} → ${telefonos.join(', ')}`);

      const resultados = await Promise.allSettled(
        telefonos.map(telefono => whatsappService.sendTextMessage(telefono, mensaje))
      );

      const detalle = telefonos.map((tel, i) => {
        const r = resultados[i];
        const ok = r.status === 'fulfilled' && r.value.success;
        const error = r.status === 'rejected'
          ? String(r.reason)
          : (r.value.success ? null : (r.value.error || 'error desconocido'));
        if (ok) console.log(`✅ Notificación SOFTSERVE enviada a ${tel}`);
        else console.error(`❌ Error enviando notificación SOFTSERVE a ${tel}:`, error);
        return { telefono: tel, ok, error };
      });
      const enviados = detalle.filter(d => d.ok).length;
      const estado = enviados === 0 ? 'fallida' : (enviados === telefonos.length ? 'enviada' : 'parcial');

      if (estado === 'fallida') {
        // Liberar el candado para reintentar en un próximo guardado.
        await postgresService.query(`DELETE FROM softserve_notificaciones WHERE historia_id = $1`, [payload.historiaId]);
      } else {
        await postgresService.query(
          `UPDATE softserve_notificaciones SET estado = $2, detalle = $3::jsonb WHERE historia_id = $1`,
          [payload.historiaId, estado, JSON.stringify(detalle)]
        );
      }
      console.log(`🧾 Notificación SOFTSERVE registrada: ${estado} (${enviados}/${telefonos.length})`);
    } catch (error: any) {
      console.error('❌ Error enviando notificación SOFTSERVE por WhatsApp:', error.message);
    }
  }
}

export default new MedicalHistoryService();
