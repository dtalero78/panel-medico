import postgresService from './postgres.service';

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

interface HistoriaClinicaData {
  _id: string;
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
  codEmpresa?: string;
  empresa?: string;
  cargo?: string;
  tipoExamen?: string;
  encuestaSalud?: string;
  antecedentesFamiliares?: string;
  empresa1?: string;
  mdAntecedentes?: string;
  mdObsParaMiDocYa?: string;
  mdObservacionesCertificado?: string;
  mdRecomendacionesMedicasAdicionales?: string;
  mdConceptoFinal?: string;
  mdDx1?: string;
  mdDx2?: string;
  talla?: string;
  peso?: string;
  motivoConsulta?: string;
  diagnostico?: string;
  tratamiento?: string;
  fechaAtencion?: Date;
  fechaConsulta?: Date;
  atendido?: string;
  pvEstado?: string;
  medico?: string;
  // Nuevos campos de formulario
  antecedentesPersonales?: AntecedentesPersonales;
  antecedentesFamiliaresDetalle?: AntecedentesFamiliares;
}

/**
 * Servicio para manejar operaciones de HistoriaClinica en PostgreSQL
 */
class HistoriaClinicaPostgresService {
  /**
   * Inserta o actualiza (UPSERT) una historia clínica
   * Si el _id ya existe, actualiza; si no, inserta
   */
  async upsert(data: HistoriaClinicaData): Promise<boolean> {
    try {
      const query = `
        INSERT INTO "HistoriaClinica" (
          "_id", "numeroId", "primerNombre", "segundoNombre", "primerApellido", "segundoApellido",
          "celular", "email",
          "codEmpresa", "empresa", "cargo", "tipoExamen",
          "mdAntecedentes", "mdObsParaMiDocYa", "mdObservacionesCertificado",
          "mdRecomendacionesMedicasAdicionales", "mdConceptoFinal", "mdDx1", "mdDx2",
          "talla", "peso", "motivoConsulta", "diagnostico", "tratamiento",
          "fechaAtencion", "fechaConsulta", "atendido", "pvEstado", "medico"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
        )
        ON CONFLICT ("_id") DO UPDATE SET
          "numeroId" = EXCLUDED."numeroId",
          "primerNombre" = EXCLUDED."primerNombre",
          "segundoNombre" = EXCLUDED."segundoNombre",
          "primerApellido" = EXCLUDED."primerApellido",
          "segundoApellido" = EXCLUDED."segundoApellido",
          "celular" = EXCLUDED."celular",
          "email" = EXCLUDED."email",
          "codEmpresa" = EXCLUDED."codEmpresa",
          "empresa" = EXCLUDED."empresa",
          "cargo" = EXCLUDED."cargo",
          "tipoExamen" = EXCLUDED."tipoExamen",
          "mdAntecedentes" = EXCLUDED."mdAntecedentes",
          "mdObsParaMiDocYa" = EXCLUDED."mdObsParaMiDocYa",
          "mdObservacionesCertificado" = EXCLUDED."mdObservacionesCertificado",
          "mdRecomendacionesMedicasAdicionales" = EXCLUDED."mdRecomendacionesMedicasAdicionales",
          "mdConceptoFinal" = EXCLUDED."mdConceptoFinal",
          "mdDx1" = EXCLUDED."mdDx1",
          "mdDx2" = EXCLUDED."mdDx2",
          "talla" = EXCLUDED."talla",
          "peso" = EXCLUDED."peso",
          "motivoConsulta" = EXCLUDED."motivoConsulta",
          "diagnostico" = EXCLUDED."diagnostico",
          "tratamiento" = EXCLUDED."tratamiento",
          "fechaAtencion" = EXCLUDED."fechaAtencion",
          "fechaConsulta" = EXCLUDED."fechaConsulta",
          "atendido" = EXCLUDED."atendido",
          "pvEstado" = EXCLUDED."pvEstado",
          "medico" = EXCLUDED."medico",
          "_updatedDate" = NOW()
        RETURNING "_id";
      `;

      const params = [
        data._id,
        data.numeroId,
        data.primerNombre,
        data.segundoNombre || null,
        data.primerApellido,
        data.segundoApellido || null,
        data.celular,
        data.email || null,
        data.codEmpresa || null,
        data.empresa || null,
        data.cargo || null,
        data.tipoExamen || null,
        data.mdAntecedentes || null,
        data.mdObsParaMiDocYa || null,
        data.mdObservacionesCertificado || null,
        data.mdRecomendacionesMedicasAdicionales || null,
        data.mdConceptoFinal || null,
        data.mdDx1 || null,
        data.mdDx2 || null,
        data.talla || null,
        data.peso || null,
        data.motivoConsulta || null,
        data.diagnostico || null,
        data.tratamiento || null,
        data.fechaAtencion || null,
        data.fechaConsulta || null,
        data.atendido || null,
        data.pvEstado || null,
        data.medico || null,
      ];

      const result = await postgresService.query(query, params);

      if (result && result.length > 0) {
        console.log(`✅ [PostgreSQL] Historia clínica guardada: ${data._id}`);
        return true;
      }

      console.warn(`⚠️  [PostgreSQL] No se pudo guardar historia clínica: ${data._id}`);
      return false;
    } catch (error) {
      console.error(`❌ [PostgreSQL] Error guardando historia clínica ${data._id}:`, error);
      return false;
    }
  }

  /**
   * Obtiene una historia clínica por _id con LEFT JOIN a formularios
   * para incluir antecedentes personales y familiares
   */
  async getById(id: string): Promise<HistoriaClinicaData | null> {
    try {
      const query = `
        SELECT
          h.*,
          f.cirugia_ocular,
          f.cirugia_programada,
          f.condicion_medica,
          f.dolor_cabeza,
          f.dolor_espalda,
          f.embarazo,
          f.enfermedad_higado,
          f.enfermedad_pulmonar,
          f.fuma,
          f.consumo_licor,
          f.hernias,
          f.hormigueos,
          f.presion_alta,
          f.problemas_azucar,
          f.problemas_cardiacos,
          f.problemas_sueno,
          f.usa_anteojos,
          f.usa_lentes_contacto,
          f.varices,
          f.hepatitis,
          f.trastorno_psicologico,
          f.sintomas_psicologicos,
          f.diagnostico_cancer,
          f.enfermedades_laborales,
          f.enfermedad_osteomuscular,
          f.enfermedad_autoinmune,
          f.ruido_jaqueca,
          f.familia_hereditarias,
          f.familia_geneticas,
          f.familia_diabetes,
          f.familia_hipertension,
          f.familia_infartos,
          f.familia_cancer,
          f.familia_trastornos,
          f.familia_infecciosas
        FROM "HistoriaClinica" h
        LEFT JOIN formularios f ON h."numeroId" = f.numero_id
        WHERE h."_id" = $1
      `;
      const result = await postgresService.query(query, [id]);

      if (result && result.length > 0) {
        const row = result[0];

        // Convertir valores de formularios a boolean
        // Soporta formatos: true, 'true', 'Sí', 'SI'
        const toBool = (val: any): boolean => {
          return val === true || val === 'true' || val === 'Sí' || val === 'SI';
        };

        return {
          ...row,
          // Antecedentes personales (27 campos)
          antecedentesPersonales: {
            cirugiaOcular: toBool(row.cirugia_ocular),
            cirugiaProgramada: toBool(row.cirugia_programada),
            condicionMedica: toBool(row.condicion_medica),
            dolorCabeza: toBool(row.dolor_cabeza),
            dolorEspalda: toBool(row.dolor_espalda),
            embarazo: toBool(row.embarazo),
            enfermedadHigado: toBool(row.enfermedad_higado),
            enfermedadPulmonar: toBool(row.enfermedad_pulmonar),
            fuma: toBool(row.fuma),
            consumoLicor: toBool(row.consumo_licor),
            hernias: toBool(row.hernias),
            hormigueos: toBool(row.hormigueos),
            presionAlta: toBool(row.presion_alta),
            problemasAzucar: toBool(row.problemas_azucar),
            problemasCardiacos: toBool(row.problemas_cardiacos),
            problemasSueno: toBool(row.problemas_sueno),
            usaAnteojos: toBool(row.usa_anteojos),
            usaLentesContacto: toBool(row.usa_lentes_contacto),
            varices: toBool(row.varices),
            hepatitis: toBool(row.hepatitis),
            trastornoPsicologico: toBool(row.trastorno_psicologico),
            sintomasPsicologicos: toBool(row.sintomas_psicologicos),
            diagnosticoCancer: toBool(row.diagnostico_cancer),
            enfermedadesLaborales: toBool(row.enfermedades_laborales),
            enfermedadOsteomuscular: toBool(row.enfermedad_osteomuscular),
            enfermedadAutoinmune: toBool(row.enfermedad_autoinmune),
            ruidoJaqueca: toBool(row.ruido_jaqueca),
          },
          // Antecedentes familiares (8 campos)
          antecedentesFamiliaresDetalle: {
            hereditarias: toBool(row.familia_hereditarias),
            geneticas: toBool(row.familia_geneticas),
            diabetes: toBool(row.familia_diabetes),
            hipertension: toBool(row.familia_hipertension),
            infartos: toBool(row.familia_infartos),
            cancer: toBool(row.familia_cancer),
            trastornos: toBool(row.familia_trastornos),
            infecciosas: toBool(row.familia_infecciosas),
          },
        } as HistoriaClinicaData;
      }

      return null;
    } catch (error) {
      console.error(`❌ [PostgreSQL] Error obteniendo historia clínica ${id}:`, error);
      return null;
    }
  }

  /**
   * Busca historias clínicas por documento
   */
  async getByNumeroId(numeroId: string): Promise<HistoriaClinicaData[]> {
    try {
      const query = 'SELECT * FROM "HistoriaClinica" WHERE "numeroId" = $1 ORDER BY "_createdDate" DESC';
      const result = await postgresService.query(query, [numeroId]);

      return (result || []) as HistoriaClinicaData[];
    } catch (error) {
      console.error(`❌ [PostgreSQL] Error buscando por numeroId ${numeroId}:`, error);
      return [];
    }
  }
}

export default new HistoriaClinicaPostgresService();
