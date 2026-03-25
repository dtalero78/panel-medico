import historiaClinicaPostgresService from './historia-clinica-postgres.service';
import whatsappService from './whatsapp.service';

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

      // Actualizar en PostgreSQL
      const success = await historiaClinicaPostgresService.upsert({
        _id: payload.historiaId,
        // Datos base del paciente (no cambian)
        numeroId: historiaBase.numeroId,
        primerNombre: historiaBase.primerNombre,
        segundoNombre: historiaBase.segundoNombre,
        primerApellido: historiaBase.primerApellido,
        segundoApellido: historiaBase.segundoApellido,
        celular: historiaBase.celular,
        email: historiaBase.email,
        codEmpresa: historiaBase.codEmpresa,
        tipoExamen: historiaBase.tipoExamen,
        fechaAtencion: historiaBase.fechaAtencion,
        medico: historiaBase.medico,

        // Datos médicos ingresados por el doctor (del payload)
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

        // Campos de estado
        fechaConsulta: new Date(),
        atendido: 'ATENDIDO',
      });

      if (success) {
        console.log(`✅ [PostgreSQL] Historia clínica actualizada exitosamente para ${payload.historiaId}`);

        // Enviar alerta WhatsApp para OMEGA con concepto crítico
        this.sendOmegaAlertIfNeeded(historiaBase, payload);

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
   * Envía alerta WhatsApp cuando un paciente OMEGA tiene concepto NO APTO, APLAZADO o APTO CON RECOMENDACIONES
   */
  private async sendOmegaAlertIfNeeded(
    historiaBase: MedicalHistoryData,
    payload: UpdateMedicalHistoryPayload
  ): Promise<void> {
    try {
      const conceptosAlerta = ['NO APTO', 'APLAZADO', 'APTO CON RECOMENDACIONES'];

      if (
        historiaBase.codEmpresa?.toUpperCase() !== 'OMEGA' ||
        !payload.mdConceptoFinal ||
        !conceptosAlerta.includes(payload.mdConceptoFinal.toUpperCase())
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

      const telefonos = ['573008021701', '573166939639', '573202543077'];

      console.log(`🚨 Enviando alerta OMEGA para ${nombrePaciente} - Concepto: ${payload.mdConceptoFinal}`);

      for (const telefono of telefonos) {
        await whatsappService.sendTextMessage(telefono, mensaje);
      }

      console.log(`✅ Alertas OMEGA enviadas a ${telefonos.length} destinatarios`);
    } catch (error: any) {
      // No bloquear el guardado si falla el envío de alertas
      console.error('❌ Error enviando alerta OMEGA por WhatsApp:', error.message);
    }
  }
}

export default new MedicalHistoryService();
