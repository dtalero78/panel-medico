import { useState, useEffect } from 'react';
import apiService from '../services/api.service';

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
  historiaId: string;
  numeroId: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  celular: string;
  email?: string;
  fechaNacimiento?: string;
  edad?: number;
  genero?: string;
  estadoCivil?: string;
  hijos?: string;
  ejercicio?: string;
  codEmpresa?: string;
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
  antecedentesPersonales?: AntecedentesPersonales;
  antecedentesFamiliaresDetalle?: AntecedentesFamiliares;
}

interface MedicalHistoryPanelProps {
  historiaId: string;
  onAppendToObservaciones?: (appendFn: (text: string) => void) => void;
}

type LabFieldTuple = [string, string];
interface LabGroup {
  title: string;
  fields: LabFieldTuple[];
}

const LAB_GROUPS: LabGroup[] = [
  {
    title: 'Hemograma',
    fields: [
      ['hematocrito', 'Hematocrito'],
      ['hemoglobina', 'Hemoglobina'],
      ['conc_corpus_hb', 'Conc. Corpuscular Hb'],
      ['plaquetas', 'Plaquetas'],
      ['sedimentacio_globular', 'Sed. Globular'],
      ['globulos_blancos', 'Glóbulos Blancos'],
      ['neutrofilos', 'Neutrófilos'],
      ['linfocitos', 'Linfocitos'],
      ['monocitos', 'Monocitos'],
      ['basofilos', 'Basófilos'],
      ['eosinofilos', 'Eosinófilos'],
      ['cayados', 'Cayados'],
      ['observaciones_hemograma', 'Observaciones'],
    ],
  },
  {
    title: 'Coprológico',
    fields: [
      ['consistencia', 'Consistencia'],
      ['color', 'Color'],
      ['olor', 'Olor'],
      ['moco', 'Moco'],
      ['sangre', 'Sangre'],
      ['parasitologico', 'Parasitológico'],
      ['vegetales', 'Vegetales'],
      ['musculares', 'Musculares'],
      ['celulosa', 'Celulosa'],
      ['almidones', 'Almidones'],
      ['levaduras', 'Levaduras'],
      ['hongos', 'Hongos'],
      ['neutras', 'Neutras'],
      ['hominis', 'Hominis'],
      ['leucocitos', 'Leucocitos'],
      ['bacteriana', 'Flora Bacteriana'],
      ['observaciones_coprologico', 'Observaciones'],
    ],
  },
  {
    title: 'Química / Perfil Lipídico',
    fields: [
      ['glicemia_pre', 'Glicemia (pre)'],
      ['glicemia_post', 'Glicemia (post)'],
      ['tsh', 'TSH'],
      ['colesterol_total', 'Colesterol Total'],
      ['colesterol_hdl', 'Colesterol HDL'],
      ['colesterol_ldl', 'Colesterol LDL'],
      ['trigliceridos', 'Triglicéridos'],
      ['transaminasa_gpt', 'Transaminasa GPT'],
      ['transaminasa_got', 'Transaminasa GOT'],
      ['bilirrubina_directa', 'Bilirrubina Directa'],
      ['bilirrubina_indirecta', 'Bilirrubina Indirecta'],
      ['bilirrubina_total', 'Bilirrubina Total'],
      ['nitrogeno_ureico_bun', 'Nitrógeno Ureico (BUN)'],
      ['creatinina_en_suero', 'Creatinina en Suero'],
      ['colinesterasa', 'Colinesterasa'],
      ['fosfatasa_alcalina', 'Fosfatasa Alcalina'],
      ['quimica_observaciones', 'Observaciones'],
    ],
  },
  {
    title: 'Inmunología',
    fields: [
      ['grupo_sanguineo', 'Grupo Sanguíneo'],
      ['factor_rh', 'Factor Rh'],
      ['serologia_vdrl', 'Serología VDRL'],
      ['serologia_cuantitativa', 'Serología Cuantitativa'],
      ['como_reporto_a_la_empresa', 'Cómo se Reportó a la Empresa'],
      ['inmunologia_observaciones', 'Observaciones'],
    ],
  },
  {
    title: 'Microbiología',
    fields: [
      ['frotis_faringeo', 'Frotis Faríngeo'],
      ['cultivo_faringeo', 'Cultivo Faríngeo'],
      ['frotis_naso_derecha', 'Frotis Naso (Derecha)'],
      ['frotis_naso_izquierda', 'Frotis Naso (Izquierda)'],
      ['koh_en_unas', 'KOH en Uñas'],
      ['coprocultivo', 'Coprocultivo'],
      ['leptospira', 'Leptospira'],
      ['baciloscopia', 'Baciloscopia'],
      ['microbiologia_observaciones', 'Observaciones'],
    ],
  },
  {
    title: 'Toxicología',
    fields: [
      ['alcohol_aire_respirado', 'Alcohol (Aire Respirado)'],
      ['alcohol_saliva', 'Alcohol (Saliva)'],
      ['alcohol_sangre', 'Alcohol (Sangre)'],
      ['marihuana_orina', 'Marihuana (Orina)'],
      ['cocaina', 'Cocaína'],
      ['morfina', 'Morfina'],
      ['metanfetaminas', 'Metanfetaminas'],
      ['anfetaminas', 'Anfetaminas'],
      ['toxicologia_observaciones', 'Observaciones'],
    ],
  },
];

const hasLabValue = (val: any): boolean => {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string' && val.trim() === '') return false;
  return true;
};

// Frecuencias de audiometría (Hz)
const AUDIO_FREQS_AEREO = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000] as const;
const AUDIO_FREQS_OSEO = [250, 500, 1000, 2000, 3000, 4000] as const;

const AUDIO_OTOSCOPIA_FIELDS: LabFieldTuple[] = [
  ['pabellon_auricular_od', 'Pabellón Auricular OD'],
  ['pabellon_auricular_oi', 'Pabellón Auricular OI'],
  ['conducto_auditivo_od', 'Conducto Auditivo OD'],
  ['conducto_auditivo_oi', 'Conducto Auditivo OI'],
  ['membrana_timpanica_od', 'Membrana Timpánica OD'],
  ['membrana_timpanica_oi', 'Membrana Timpánica OI'],
  ['observaciones_od', 'Observaciones OD'],
  ['observaciones_oi', 'Observaciones OI'],
  ['requiere_limpieza_otica', 'Requiere Limpieza Ótica'],
  ['estado_gripal', 'Estado Gripal'],
];

const AUDIO_DIAGNOSTICO_FIELDS: LabFieldTuple[] = [
  ['diagnostico_od', 'Diagnóstico OD'],
  ['diagnostico_oi', 'Diagnóstico OI'],
  ['interpretacion', 'Interpretación'],
  ['recomendaciones', 'Recomendaciones'],
  ['remision', 'Remisión'],
  ['cabina', 'Cabina'],
  ['equipo', 'Equipo'],
];

// Visiometría presencial — agrupada por área (mismo patrón visual que laboratorios)
const VISIOMETRIA_GROUPS: LabGroup[] = [
  {
    title: 'Visión Lejana',
    fields: [
      ['vl_od_sin_correccion', 'OD sin corrección'],
      ['vl_od_con_correccion', 'OD con corrección'],
      ['vl_oi_sin_correccion', 'OI sin corrección'],
      ['vl_oi_con_correccion', 'OI con corrección'],
      ['vl_ao_sin_correccion', 'AO sin corrección'],
      ['vl_ao_con_correccion', 'AO con corrección'],
      ['vl_foria_lateral', 'Foria Lateral'],
      ['vl_foria_vertical', 'Foria Vertical'],
    ],
  },
  {
    title: 'Visión Cercana',
    fields: [
      ['vc_od_sin_correccion', 'OD sin corrección'],
      ['vc_od_con_correccion', 'OD con corrección'],
      ['vc_oi_sin_correccion', 'OI sin corrección'],
      ['vc_oi_con_correccion', 'OI con corrección'],
      ['vc_ao_sin_correccion', 'AO sin corrección'],
      ['vc_ao_con_correccion', 'AO con corrección'],
      ['vc_foria_lateral', 'Foria Lateral'],
      ['vc_campimetria', 'Campimetría'],
    ],
  },
  {
    title: 'Cromática, Forias y Cover Test',
    fields: [
      ['vision_cromatica', 'Visión Cromática'],
      ['ishihara', 'Ishihara'],
      ['ppc', 'PPC'],
      ['enceguecimiento', 'Enceguecimiento'],
      ['estado_forico', 'Estado Fórico'],
      ['cover_test_lejos', 'Cover Test Lejos'],
      ['cover_test_cerca', 'Cover Test Cerca'],
    ],
  },
  {
    title: 'Examen Externo y Tonometría',
    fields: [
      ['examen_externo', 'Examen Externo'],
      ['oftalmoscopia_od', 'Oftalmoscopia OD'],
      ['oftalmoscopia_oi', 'Oftalmoscopia OI'],
      ['biomicroscopia_od', 'Biomicroscopia OD'],
      ['biomicroscopia_oi', 'Biomicroscopia OI'],
      ['tonometria_od', 'Tonometría OD'],
      ['tonometria_oi', 'Tonometría OI'],
      ['queratometria_od', 'Queratometría OD'],
      ['queratometria_oi', 'Queratometría OI'],
    ],
  },
  {
    title: 'Refractometría y Rx',
    fields: [
      ['rx_en_uso', 'Rx en Uso'],
      ['refractometria_od', 'Refractometría OD'],
      ['refractometria_oi', 'Refractometría OI'],
      ['subjetivo_od', 'Subjetivo OD'],
      ['subjetivo_oi', 'Subjetivo OI'],
      ['rx_final_od', 'Rx Final OD'],
      ['rx_final_oi', 'Rx Final OI'],
      ['dip', 'DIP'],
      ['filtro', 'Filtro'],
      ['uso', 'Uso'],
    ],
  },
  {
    title: 'Diagnóstico Visiométrico',
    fields: [
      ['diagnostico', 'Diagnóstico'],
      ['dx2', 'Dx 2'],
      ['dx3', 'Dx 3'],
      ['control', 'Control'],
      ['remision', 'Remisión'],
      ['observaciones', 'Observaciones'],
    ],
  },
];

const audiometriaHasAereo = (row: any): boolean =>
  !!row && AUDIO_FREQS_AEREO.some((f) =>
    hasLabValue(row[`aereo_od_${f}`]) || hasLabValue(row[`aereo_oi_${f}`])
  );

const audiometriaHasOseo = (row: any): boolean =>
  !!row && AUDIO_FREQS_OSEO.some((f) =>
    hasLabValue(row[`oseo_od_${f}`]) || hasLabValue(row[`oseo_oi_${f}`])
  );

const audiometriaHasContent = (row: any): boolean => {
  if (!row) return false;
  if (audiometriaHasAereo(row) || audiometriaHasOseo(row)) return true;
  const otherFields = [...AUDIO_OTOSCOPIA_FIELDS, ...AUDIO_DIAGNOSTICO_FIELDS];
  return otherFields.some(([key]) => hasLabValue(row[key]));
};

const visiometriaHasContent = (row: any): boolean => {
  if (!row) return false;
  return VISIOMETRIA_GROUPS.some((group) =>
    group.fields.some(([key]) => hasLabValue(row[key]))
  );
};

const visiometriaVirtualHasContent = (row: any): boolean => {
  if (!row) return false;
  return (
    hasLabValue(row.snellen_porcentaje) ||
    hasLabValue(row.landolt_porcentaje) ||
    hasLabValue(row.ishihara_porcentaje) ||
    hasLabValue(row.concepto)
  );
};

const consolidarLaboratorios = (rows: any[]): Record<string, string> => {
  const consolidado: Record<string, string> = {};
  if (!Array.isArray(rows) || rows.length === 0) return consolidado;
  // Las filas vienen ORDER BY created_at DESC. Recorremos de la más vieja a la más nueva
  // para que la más reciente sobrescriba campos repetidos.
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i] || {};
    Object.keys(row).forEach((key) => {
      if (hasLabValue(row[key])) {
        consolidado[key] = String(row[key]);
      }
    });
  }
  return consolidado;
};

export const MedicalHistoryPanel = ({ historiaId, onAppendToObservaciones }: MedicalHistoryPanelProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MedicalHistoryData | null>(null);
  const [laboratorios, setLaboratorios] = useState<Record<string, string>>({});
  const [audiometria, setAudiometria] = useState<any | null>(null);
  const [visiometria, setVisiometria] = useState<any | null>(null);
  const [visiometriaVirtual, setVisiometriaVirtual] = useState<any | null>(null);

  // Función para traducir nombres de campos a español
  const formatFieldName = (fieldName: string): string => {
    const translations: { [key: string]: string } = {
      // Antecedentes personales
      cirugiaOcular: 'Cirugía Ocular',
      cirugiaProgramada: 'Cirugía Programada',
      condicionMedica: 'Condición Médica',
      dolorCabeza: 'Dolor de Cabeza',
      dolorEspalda: 'Dolor de Espalda',
      embarazo: 'Embarazo',
      enfermedadHigado: 'Enfermedad del Hígado',
      enfermedadPulmonar: 'Enfermedad Pulmonar',
      fuma: 'Fuma',
      consumoLicor: 'Consumo de Licor',
      hernias: 'Hernias',
      hormigueos: 'Hormigueos',
      presionAlta: 'Presión Alta',
      problemasAzucar: 'Problemas de Azúcar',
      problemasCardiacos: 'Problemas Cardíacos',
      problemasSueno: 'Problemas de Sueño',
      usaAnteojos: 'Usa Anteojos',
      usaLentesContacto: 'Usa Lentes de Contacto',
      varices: 'Várices',
      hepatitis: 'Hepatitis',
      trastornoPsicologico: 'Trastorno Psicológico',
      sintomasPsicologicos: 'Síntomas Psicológicos',
      diagnosticoCancer: 'Diagnóstico de Cáncer',
      enfermedadesLaborales: 'Enfermedades Laborales',
      enfermedadOsteomuscular: 'Enfermedad Osteomuscular',
      enfermedadAutoinmune: 'Enfermedad Autoinmune',
      ruidoJaqueca: 'Ruido/Jaqueca',
      // Antecedentes familiares
      hereditarias: 'Enfermedades Hereditarias',
      geneticas: 'Enfermedades Genéticas',
      diabetes: 'Diabetes',
      hipertension: 'Hipertensión',
      infartos: 'Infartos',
      cancer: 'Cáncer',
      trastornos: 'Trastornos',
      infecciosas: 'Enfermedades Infecciosas',
    };
    return translations[fieldName] || fieldName;
  };

  // Función para obtener condiciones positivas
  const getPositiveConditions = (): string[] => {
    if (!data) return [];

    const conditions: string[] = [];

    // Agregar antecedentes personales positivos
    if (data.antecedentesPersonales) {
      Object.entries(data.antecedentesPersonales).forEach(([key, value]) => {
        if (value === true) {
          conditions.push(formatFieldName(key));
        }
      });
    }

    // Agregar antecedentes familiares positivos (con prefijo "Fam:")
    if (data.antecedentesFamiliaresDetalle) {
      Object.entries(data.antecedentesFamiliaresDetalle).forEach(([key, value]) => {
        if (value === true) {
          conditions.push(`Fam: ${formatFieldName(key)}`);
        }
      });
    }

    return conditions;
  };

  // Campos editables
  const [mdAntecedentes, setMdAntecedentes] = useState('');
  const [mdObsParaMiDocYa, setMdObsParaMiDocYa] = useState('');
  const [mdObservacionesCertificado, setMdObservacionesCertificado] = useState('');
  const [mdRecomendacionesMedicasAdicionales, setMdRecomendacionesMedicasAdicionales] = useState('');
  const [mdConceptoFinal, setMdConceptoFinal] = useState('');
  const [mdDx1, setMdDx1] = useState('');
  const [mdDx2, setMdDx2] = useState('');
  const [talla, setTalla] = useState('');
  const [peso, setPeso] = useState('');
  const [imc, setImc] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    loadMedicalHistory();
  }, [historiaId]);

  // Exponer función para agregar texto a observaciones desde componentes externos
  useEffect(() => {
    if (onAppendToObservaciones) {
      // Crear función que agrega texto al campo actual
      const appendText = (text: string) => {
        setMdObservacionesCertificado(prev => {
          if (prev) {
            return `${prev}\n\n${text}`;
          }
          return text;
        });
      };

      // "Registrar" la función llamándola inmediatamente
      // Esto permite que el padre llame a esta función cuando sea necesario
      onAppendToObservaciones(appendText);
    }
  }, [onAppendToObservaciones]);

  // Calcular IMC automáticamente cuando cambian talla o peso
  useEffect(() => {
    if (talla && peso) {
      const tallaNum = parseFloat(talla);
      const pesoNum = parseFloat(peso);

      if (!isNaN(tallaNum) && !isNaN(pesoNum) && tallaNum > 0) {
        // IMC = peso(kg) / (talla(m))^2
        const tallaMetros = tallaNum / 100;
        const imcCalculado = pesoNum / (tallaMetros * tallaMetros);
        setImc(imcCalculado.toFixed(2));
      } else {
        setImc('');
      }
    } else {
      setImc('');
    }
  }, [talla, peso]);

  // Función para determinar el color del IMC
  const getImcColor = () => {
    const imcNum = parseFloat(imc);
    if (isNaN(imcNum)) return 'text-gray-400';
    if (imcNum >= 25) return 'text-red-500'; // Sobrepeso u obesidad
    return 'text-green-400'; // Normal o bajo peso
  };

  // Función para obtener el texto de interpretación del IMC
  const getImcInterpretation = () => {
    const imcNum = parseFloat(imc);
    if (isNaN(imcNum)) return '';
    if (imcNum < 18.5) return 'Bajo peso';
    if (imcNum < 25) return 'Normal';
    if (imcNum < 30) return 'Sobrepeso';
    return 'Obesidad';
  };

  const loadMedicalHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const history = await apiService.getMedicalHistory(historiaId);
      setData(history);

      // Cargar resultados complementarios en paralelo (no bloquea si alguno falla)
      const [labsRes, audioRes, visRes, visVirtualRes] = await Promise.allSettled([
        apiService.getLaboratorios(historiaId),
        apiService.getAudiometria(historiaId),
        apiService.getVisiometria(historiaId),
        apiService.getVisiometriaVirtual(historiaId),
      ]);

      setLaboratorios(
        labsRes.status === 'fulfilled' ? consolidarLaboratorios(labsRes.value) : {}
      );
      setAudiometria(audioRes.status === 'fulfilled' ? audioRes.value : null);
      setVisiometria(visRes.status === 'fulfilled' ? visRes.value : null);
      setVisiometriaVirtual(
        visVirtualRes.status === 'fulfilled' ? visVirtualRes.value : null
      );

      if (labsRes.status === 'rejected') console.warn('Laboratorios:', labsRes.reason);
      if (audioRes.status === 'rejected') console.warn('Audiometría:', audioRes.reason);
      if (visRes.status === 'rejected') console.warn('Visiometría:', visRes.reason);
      if (visVirtualRes.status === 'rejected') console.warn('Visiometría virtual:', visVirtualRes.reason);

      // Pre-llenar campos editables
      setMdAntecedentes(history.mdAntecedentes || '');
      setMdObsParaMiDocYa(history.mdObsParaMiDocYa || '');
      setMdObservacionesCertificado(history.mdObservacionesCertificado || '');
      setMdRecomendacionesMedicasAdicionales(history.mdRecomendacionesMedicasAdicionales || '');
      setMdConceptoFinal(history.mdConceptoFinal || '');
      setMdDx1(history.mdDx1 || '');
      setMdDx2(history.mdDx2 || '');
      setTalla(history.talla || '');
      setPeso(history.peso || '');
    } catch (err: any) {
      setError(err.message || 'Error al cargar historia clínica');
      console.error('Error loading medical history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAISuggestions = async () => {
    if (!data) return;

    try {
      setIsGeneratingAI(true);
      setError(null);

      const patientData = {
        edad: data.edad,
        genero: data.genero,
        estadoCivil: data.estadoCivil,
        hijos: data.hijos,
        ejercicio: data.ejercicio,
        codEmpresa: data.codEmpresa,
        cargo: data.cargo,
        tipoExamen: data.tipoExamen,
        antecedentesFamiliares: data.antecedentesFamiliares,
        encuestaSalud: data.encuestaSalud,
        empresa1: data.empresa1,
      };

      const suggestions = await apiService.generateAISuggestions(patientData);
      setAiSuggestions(suggestions);
    } catch (err: any) {
      setError(err.message || 'Error al generar sugerencias con IA');
      console.error('Error generating AI suggestions:', err);
      alert('Error al generar sugerencias con IA');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;

    if (!mdConceptoFinal) {
      alert('Debe seleccionar un Concepto Final antes de guardar.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Concatenar sugerencias de IA con recomendaciones manuales
      const combinedRecommendations = aiSuggestions
        ? `${aiSuggestions}\n\n${mdRecomendacionesMedicasAdicionales}`.trim()
        : mdRecomendacionesMedicasAdicionales;

      // Concatenar IMC con antecedentes
      let combinedAntecedentes = mdAntecedentes;
      if (imc) {
        const imcText = `IMC: ${imc} (${getImcInterpretation()})`;
        combinedAntecedentes = mdAntecedentes
          ? `${mdAntecedentes}\n\n${imcText}`
          : imcText;
      }

      await apiService.updateMedicalHistory({
        historiaId: data.historiaId,
        mdAntecedentes: combinedAntecedentes,
        mdObsParaMiDocYa,
        mdObservacionesCertificado,
        mdRecomendacionesMedicasAdicionales: combinedRecommendations,
        mdConceptoFinal,
        mdDx1,
        mdDx2,
        talla,
        peso,
        cargo: data.cargo,
      });

      alert('Historia clínica guardada exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error al guardar historia clínica');
      console.error('Error saving medical history:', err);
      alert('Error al guardar historia clínica');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#1f2c34] rounded-xl p-6 text-white">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]"></div>
          <span className="ml-3">Cargando historia clínica...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    const isWixNotConfigured = error && error.includes('Error al obtener historia clínica');

    return (
      <div className="h-full flex flex-col bg-[#1f2c34] text-white p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-red-400">Error al Cargar Historia Clínica</h2>
        </div>

        <div className="bg-[#2a3942] rounded-lg p-4 mb-4">
          <p className="text-red-400 mb-3">
            {error || 'No se encontró historia clínica para este paciente'}
          </p>

          {isWixNotConfigured && (
            <div className="mt-4 border-l-4 border-yellow-500 pl-4">
              <p className="text-yellow-400 font-semibold mb-2">⚠️ Configuración Pendiente</p>
              <p className="text-sm text-gray-300 mb-2">
                Las funciones HTTP de Wix no están configuradas. Para activar esta funcionalidad:
              </p>
              <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                <li>Abre tu sitio de Wix (www.bsl.com.co)</li>
                <li>Activa el Developer Mode (Velo)</li>
                <li>Ve a Backend → http-functions.js</li>
                <li>Copia las funciones de: <code className="bg-gray-700 px-1 rounded">backend/wix-backend-medical-history.js</code></li>
                <li>Publica el sitio</li>
              </ol>
              <p className="text-sm text-gray-400 mt-3">
                ID de Historia: <span className="text-white font-mono">{historiaId}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1f2c34] text-white">
      {/* Header fijo */}
      <div className="flex items-center p-4 border-b border-gray-700 bg-[#1f2c34] sticky top-0 z-10">
        <h2 className="text-lg font-bold text-[#00a884]">Historia Clínica</h2>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

      {/* Información del Paciente (Solo lectura) */}
      <div className="bg-[#2a3942] rounded-lg p-3">
        <h3 className="text-sm font-semibold mb-2 text-[#00a884]">Datos del Paciente</h3>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div>
            <span className="text-gray-400">Nombre:</span>
            <span className="text-white ml-2">
              {data.primerNombre} {data.segundoNombre} {data.primerApellido} {data.segundoApellido}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Documento:</span>
            <span className="text-white ml-2">{data.numeroId}</span>
          </div>
          <div>
            <span className="text-gray-400">Edad:</span>
            <span className="text-white ml-2">{data.edad || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">Género:</span>
            <span className="text-white ml-2">{data.genero || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">Celular:</span>
            <span className="text-white ml-2">{data.celular}</span>
          </div>
          <div>
            <span className="text-gray-400">Email:</span>
            <span className="text-white ml-2">{data.email || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">Estado Civil:</span>
            <span className="text-white ml-2">{data.estadoCivil || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">Hijos:</span>
            <span className="text-white ml-2">{data.hijos || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">Ejercicio:</span>
            <span className="text-white ml-2">{data.ejercicio || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">Empresa:</span>
            <span className="text-white ml-2">{data.codEmpresa || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">Cargo:</span>
            <span className="text-white ml-2">{data.cargo || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-400">Tipo Examen:</span>
            <span className="text-white ml-2">{data.tipoExamen || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Condiciones Especiales (antecedentes positivos del formulario) */}
      {getPositiveConditions().length > 0 && (
        <div className="bg-[#2a3942] rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 text-[#00a884]">
            Condiciones Especiales
          </h3>
          <div className="flex flex-wrap gap-2">
            {getPositiveConditions().map((condition, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  condition.startsWith('Fam:')
                    ? 'bg-purple-900/30 text-purple-300 border border-purple-500/30'
                    : 'bg-amber-900/30 text-amber-300 border border-amber-500/30'
                }`}
              >
                {condition}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Antecedentes (Solo lectura) */}
      {(data.antecedentesFamiliares || data.encuestaSalud || data.empresa1) && (
        <div className="bg-[#2a3942] rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 text-[#00a884]">Antecedentes</h3>
          <div className="space-y-2 text-xs">
            {data.antecedentesFamiliares && (
              <div>
                <span className="text-gray-400">Antecedentes Familiares:</span>
                <p className="text-white mt-1 whitespace-pre-wrap">{data.antecedentesFamiliares}</p>
              </div>
            )}
            {data.encuestaSalud && (
              <div>
                <span className="text-gray-400">Encuesta de Salud:</span>
                <p className="text-white mt-1 whitespace-pre-wrap">{data.encuestaSalud}</p>
              </div>
            )}
            {data.empresa1 && (
              <div>
                <span className="text-gray-400">Cargo Anterior:</span>
                <p className="text-white mt-1">{data.empresa1}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resultados de Laboratorio (solo lectura, agrupado por área) */}
      {LAB_GROUPS.map((group) => {
        const visibleFields = group.fields.filter(([key]) => hasLabValue(laboratorios[key]));
        if (visibleFields.length === 0) return null;
        return (
          <div key={group.title} className="bg-[#2a3942] rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2 text-[#00a884]">{group.title}</h3>
            <div className="space-y-2 text-xs">
              {visibleFields.map(([key, label]) => (
                <div key={key}>
                  <span className="text-gray-400">{label}:</span>
                  <span className="text-white ml-2 whitespace-pre-wrap break-words">{laboratorios[key]}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Audiometría (presencial o virtual — misma tabla) */}
      {audiometriaHasContent(audiometria) && (
        <div className="bg-[#2a3942] rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 text-[#00a884]">Audiometría</h3>

          {/* Otoscopia (pares clave-valor) */}
          {(() => {
            const visible = AUDIO_OTOSCOPIA_FIELDS.filter(([key]) => hasLabValue(audiometria[key]));
            if (visible.length === 0) return null;
            return (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-300 mb-1">Otoscopia</h4>
                <div className="space-y-2 text-xs">
                  {visible.map(([key, label]) => (
                    <div key={key}>
                      <span className="text-gray-400">{label}:</span>
                      <span className="text-white ml-2 whitespace-pre-wrap break-words">{audiometria[key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Umbrales Aéreos (mini-tabla dB HL) */}
          {audiometriaHasAereo(audiometria) && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-300 mb-1">Vía Aérea (dB HL)</h4>
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="text-left py-1 pr-2 font-normal">Hz</th>
                      {AUDIO_FREQS_AEREO.map((f) => (
                        <th key={f} className="text-center py-1 px-1 font-normal">{f}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-gray-400 py-1 pr-2">OD</td>
                      {AUDIO_FREQS_AEREO.map((f) => (
                        <td key={f} className="text-center text-white py-1 px-1">
                          {hasLabValue(audiometria[`aereo_od_${f}`]) ? audiometria[`aereo_od_${f}`] : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="text-gray-400 py-1 pr-2">OI</td>
                      {AUDIO_FREQS_AEREO.map((f) => (
                        <td key={f} className="text-center text-white py-1 px-1">
                          {hasLabValue(audiometria[`aereo_oi_${f}`]) ? audiometria[`aereo_oi_${f}`] : '—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Umbrales Óseos (mini-tabla dB HL) */}
          {audiometriaHasOseo(audiometria) && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-300 mb-1">Vía Ósea (dB HL)</h4>
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="text-left py-1 pr-2 font-normal">Hz</th>
                      {AUDIO_FREQS_OSEO.map((f) => (
                        <th key={f} className="text-center py-1 px-1 font-normal">{f}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-gray-400 py-1 pr-2">OD</td>
                      {AUDIO_FREQS_OSEO.map((f) => (
                        <td key={f} className="text-center text-white py-1 px-1">
                          {hasLabValue(audiometria[`oseo_od_${f}`]) ? audiometria[`oseo_od_${f}`] : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="text-gray-400 py-1 pr-2">OI</td>
                      {AUDIO_FREQS_OSEO.map((f) => (
                        <td key={f} className="text-center text-white py-1 px-1">
                          {hasLabValue(audiometria[`oseo_oi_${f}`]) ? audiometria[`oseo_oi_${f}`] : '—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Diagnóstico audiométrico */}
          {(() => {
            const visible = AUDIO_DIAGNOSTICO_FIELDS.filter(([key]) => hasLabValue(audiometria[key]));
            if (visible.length === 0) return null;
            return (
              <div>
                <h4 className="text-xs font-semibold text-gray-300 mb-1">Diagnóstico</h4>
                <div className="space-y-2 text-xs">
                  {visible.map(([key, label]) => (
                    <div key={key}>
                      <span className="text-gray-400">{label}:</span>
                      <span className="text-white ml-2 whitespace-pre-wrap break-words">{audiometria[key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Visiometría presencial (agrupada por área) */}
      {visiometriaHasContent(visiometria) &&
        VISIOMETRIA_GROUPS.map((group) => {
          const visibleFields = group.fields.filter(([key]) => hasLabValue(visiometria[key]));
          if (visibleFields.length === 0) return null;
          return (
            <div key={`vis-${group.title}`} className="bg-[#2a3942] rounded-lg p-3">
              <h3 className="text-sm font-semibold mb-2 text-[#00a884]">{group.title}</h3>
              <div className="space-y-2 text-xs">
                {visibleFields.map(([key, label]) => (
                  <div key={key}>
                    <span className="text-gray-400">{label}:</span>
                    <span className="text-white ml-2 whitespace-pre-wrap break-words">{visiometria[key]}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      {/* Visiometría Virtual (Snellen / Landolt / Ishihara) */}
      {visiometriaVirtualHasContent(visiometriaVirtual) && (
        <div className="bg-[#2a3942] rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 text-[#00a884]">Visiometría Virtual</h3>
          <div className="space-y-2 text-xs">
            {hasLabValue(visiometriaVirtual.snellen_porcentaje) && (
              <div>
                <span className="text-gray-400">Snellen (Letras):</span>
                <span className="text-white ml-2">
                  {visiometriaVirtual.snellen_correctas ?? '—'} / {visiometriaVirtual.snellen_total ?? '—'}
                  {' '}({visiometriaVirtual.snellen_porcentaje}%)
                </span>
              </div>
            )}
            {hasLabValue(visiometriaVirtual.landolt_porcentaje) && (
              <div>
                <span className="text-gray-400">Landolt C (Dirección):</span>
                <span className="text-white ml-2">
                  {visiometriaVirtual.landolt_correctas ?? '—'} / {visiometriaVirtual.landolt_total ?? '—'}
                  {' '}({visiometriaVirtual.landolt_porcentaje}%)
                </span>
              </div>
            )}
            {hasLabValue(visiometriaVirtual.ishihara_porcentaje) && (
              <div>
                <span className="text-gray-400">Ishihara (Colores):</span>
                <span className="text-white ml-2">
                  {visiometriaVirtual.ishihara_correctas ?? '—'} / {visiometriaVirtual.ishihara_total ?? '—'}
                  {' '}({visiometriaVirtual.ishihara_porcentaje}%)
                </span>
              </div>
            )}
            {hasLabValue(visiometriaVirtual.concepto) && (
              <div>
                <span className="text-gray-400">Concepto:</span>
                <span className="text-white ml-2 whitespace-pre-wrap break-words">{visiometriaVirtual.concepto}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medidas Físicas */}
      <div className="bg-[#2a3942] rounded-lg p-3">
        <h3 className="text-sm font-semibold mb-2 text-[#00a884]">Medidas Físicas</h3>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Talla (cm)</label>
            <input
              type="text"
              value={talla}
              onChange={(e) => setTalla(e.target.value)}
              className="w-full bg-[#1f2c34] text-white text-sm px-2 py-2 rounded border border-gray-600 focus:border-[#00a884] focus:outline-none"
              placeholder="170"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Peso (kg)</label>
            <input
              type="text"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="w-full bg-[#1f2c34] text-white text-sm px-2 py-2 rounded border border-gray-600 focus:border-[#00a884] focus:outline-none"
              placeholder="70"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">IMC</label>
            <input
              type="text"
              value={imc ? `${imc} (${getImcInterpretation()})` : ''}
              readOnly
              className={`w-full bg-[#2a3942] ${getImcColor()} text-sm px-2 py-2 rounded border border-gray-600 cursor-not-allowed font-semibold`}
              placeholder="Auto"
            />
          </div>
        </div>
      </div>

      {/* Campos Médicos Editables */}
      <div className="bg-[#2a3942] rounded-lg p-3">
        <h3 className="text-sm font-semibold mb-3 text-[#00a884]">Evaluación Médica</h3>
        <div className="space-y-3">

        {/* 1. ANTECEDENTES */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Antecedentes</label>
          <textarea
            value={mdAntecedentes}
            onChange={(e) => setMdAntecedentes(e.target.value)}
            className="w-full bg-[#1f2c34] text-white text-sm px-2 py-2 rounded border border-gray-600 focus:border-[#00a884] focus:outline-none"
            rows={3}
            placeholder="Antecedentes médicos relevantes..."
          />
        </div>

        {/* 2. OBS. CERTIFICADO */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Obs. Certificado</label>
          <textarea
            value={mdObservacionesCertificado}
            onChange={(e) => setMdObservacionesCertificado(e.target.value)}
            className="w-full bg-[#1f2c34] text-white text-sm px-2 py-2 rounded border border-gray-600 focus:border-[#00a884] focus:outline-none"
            rows={3}
            placeholder="Observaciones para el certificado..."
          />
        </div>

        {/* 3. RECOMENDACIONES MÉDICAS ADICIONALES */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Recomendaciones Médicas Adicionales</label>
          <textarea
            value={mdRecomendacionesMedicasAdicionales}
            onChange={(e) => setMdRecomendacionesMedicasAdicionales(e.target.value)}
            className="w-full bg-[#1f2c34] text-white text-sm px-2 py-2 rounded border border-gray-600 focus:border-[#00a884] focus:outline-none"
            rows={3}
            placeholder="Recomendaciones médicas adicionales..."
          />
        </div>

        {/* 4. OBSERVACIONES PRIVADAS PARA LA EMPRESA */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Observaciones privadas para la empresa</label>
          <textarea
            value={mdObsParaMiDocYa}
            onChange={(e) => setMdObsParaMiDocYa(e.target.value)}
            className="w-full bg-[#1f2c34] text-white text-sm px-2 py-2 rounded border border-gray-600 focus:border-[#00a884] focus:outline-none"
            rows={3}
            placeholder="Observaciones privadas para la empresa..."
          />
        </div>

        {/* 5. DIAGNÓSTICOS */}
        <div className="grid grid-cols-1 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Diagnóstico 1 (Principal)</label>
            <select
              value={mdDx1}
              onChange={(e) => setMdDx1(e.target.value)}
              className="w-full bg-[#1f2c34] text-white text-sm px-2 py-2 rounded border border-gray-600 focus:border-[#00a884] focus:outline-none"
            >
              <option value="">Seleccione diagnóstico</option>
              <option value="Asma ocupacional">Asma ocupacional</option>
              <option value="Bronquitis crónica por polvos inorgánicos">Bronquitis crónica por polvos inorgánicos</option>
              <option value="Bursitis de codo">Bursitis de codo</option>
              <option value="Bursitis de hombro">Bursitis de hombro</option>
              <option value="Bursitis de rodilla">Bursitis de rodilla</option>
              <option value="Cervicalgia">Cervicalgia</option>
              <option value="Dermatitis alérgica de contacto">Dermatitis alérgica de contacto</option>
              <option value="Dermatitis irritativa de contacto">Dermatitis irritativa de contacto</option>
              <option value="Dorsalgia">Dorsalgia</option>
              <option value="Epicondilitis lateral (codo de tenista)">Epicondilitis lateral (codo de tenista)</option>
              <option value="Epicondilitis medial">Epicondilitis medial</option>
              <option value="Escoliosis">Escoliosis</option>
              <option value="Espondiloartrosis cervical">Espondiloartrosis cervical</option>
              <option value="Espondiloartrosis lumbar">Espondiloartrosis lumbar</option>
              <option value="Espondilosis cervical">Espondilosis cervical</option>
              <option value="Espondilosis lumbar">Espondilosis lumbar</option>
              <option value="Estrés postraumático">Estrés postraumático</option>
              <option value="Gonalgia (dolor de rodilla)">Gonalgia (dolor de rodilla)</option>
              <option value="Hernia discal cervical">Hernia discal cervical</option>
              <option value="Hernia discal lumbar">Hernia discal lumbar</option>
              <option value="Hipoacusia neurosensorial bilateral">Hipoacusia neurosensorial bilateral</option>
              <option value="Lumbalgia">Lumbalgia</option>
              <option value="Mialgia">Mialgia</option>
              <option value="Obesidad">Obesidad</option>
              <option value="Onicomicosis">Onicomicosis</option>
              <option value="Pérdida auditiva inducida por ruido">Pérdida auditiva inducida por ruido</option>
              <option value="Presbiacusia">Presbiacusia</option>
              <option value="Síndrome de Burnout">Síndrome de Burnout</option>
              <option value="Síndrome de túnel carpiano">Síndrome de túnel carpiano</option>
              <option value="Síndrome del manguito rotador">Síndrome del manguito rotador</option>
              <option value="Sinovitis de muñeca">Sinovitis de muñeca</option>
              <option value="Sobrepeso">Sobrepeso</option>
              <option value="Tenosinovitis de De Quervain">Tenosinovitis de De Quervain</option>
              <option value="Tendinitis de hombro">Tendinitis de hombro</option>
              <option value="Tendinitis del manguito rotador">Tendinitis del manguito rotador</option>
              <option value="Trastorno adaptativo con ansiedad">Trastorno adaptativo con ansiedad</option>
              <option value="Trastorno de ansiedad generalizada">Trastorno de ansiedad generalizada</option>
              <option value="Trastorno depresivo">Trastorno depresivo</option>
              <option value="Trastornos del sueño">Trastornos del sueño</option>
              <option value="Trauma acústico agudo">Trauma acústico agudo</option>
              <option value="Vértigo posicional">Vértigo posicional</option>
              <option value="Vitiligo">Vitiligo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Diagnóstico 2 (Secundario)</label>
            <select
              value={mdDx2}
              onChange={(e) => setMdDx2(e.target.value)}
              className="w-full bg-[#1f2c34] text-white text-sm px-2 py-2 rounded border border-gray-600 focus:border-[#00a884] focus:outline-none"
            >
              <option value="">Seleccione diagnóstico</option>
              <option value="Asma ocupacional">Asma ocupacional</option>
              <option value="Bronquitis crónica por polvos inorgánicos">Bronquitis crónica por polvos inorgánicos</option>
              <option value="Bursitis de codo">Bursitis de codo</option>
              <option value="Bursitis de hombro">Bursitis de hombro</option>
              <option value="Bursitis de rodilla">Bursitis de rodilla</option>
              <option value="Cervicalgia">Cervicalgia</option>
              <option value="Dermatitis alérgica de contacto">Dermatitis alérgica de contacto</option>
              <option value="Dermatitis irritativa de contacto">Dermatitis irritativa de contacto</option>
              <option value="Dorsalgia">Dorsalgia</option>
              <option value="Epicondilitis lateral (codo de tenista)">Epicondilitis lateral (codo de tenista)</option>
              <option value="Epicondilitis medial">Epicondilitis medial</option>
              <option value="Escoliosis">Escoliosis</option>
              <option value="Espondiloartrosis cervical">Espondiloartrosis cervical</option>
              <option value="Espondiloartrosis lumbar">Espondiloartrosis lumbar</option>
              <option value="Espondilosis cervical">Espondilosis cervical</option>
              <option value="Espondilosis lumbar">Espondilosis lumbar</option>
              <option value="Estrés postraumático">Estrés postraumático</option>
              <option value="Gonalgia (dolor de rodilla)">Gonalgia (dolor de rodilla)</option>
              <option value="Hernia discal cervical">Hernia discal cervical</option>
              <option value="Hernia discal lumbar">Hernia discal lumbar</option>
              <option value="Hipoacusia neurosensorial bilateral">Hipoacusia neurosensorial bilateral</option>
              <option value="Lumbalgia">Lumbalgia</option>
              <option value="Mialgia">Mialgia</option>
              <option value="Obesidad">Obesidad</option>
              <option value="Onicomicosis">Onicomicosis</option>
              <option value="Pérdida auditiva inducida por ruido">Pérdida auditiva inducida por ruido</option>
              <option value="Presbiacusia">Presbiacusia</option>
              <option value="Síndrome de Burnout">Síndrome de Burnout</option>
              <option value="Síndrome de túnel carpiano">Síndrome de túnel carpiano</option>
              <option value="Síndrome del manguito rotador">Síndrome del manguito rotador</option>
              <option value="Sinovitis de muñeca">Sinovitis de muñeca</option>
              <option value="Sobrepeso">Sobrepeso</option>
              <option value="Tenosinovitis de De Quervain">Tenosinovitis de De Quervain</option>
              <option value="Tendinitis de hombro">Tendinitis de hombro</option>
              <option value="Tendinitis del manguito rotador">Tendinitis del manguito rotador</option>
              <option value="Trastorno adaptativo con ansiedad">Trastorno adaptativo con ansiedad</option>
              <option value="Trastorno de ansiedad generalizada">Trastorno de ansiedad generalizada</option>
              <option value="Trastorno depresivo">Trastorno depresivo</option>
              <option value="Trastornos del sueño">Trastornos del sueño</option>
              <option value="Trauma acústico agudo">Trauma acústico agudo</option>
              <option value="Vértigo posicional">Vértigo posicional</option>
              <option value="Vitiligo">Vitiligo</option>
            </select>
          </div>
        </div>

        {/* 6. SUGERENCIAS IA */}
        <div className="border-2 border-blue-500/30 rounded-lg p-3 bg-blue-900/10">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs text-blue-400 font-semibold">Sugerencias IA</label>
            <button
              onClick={handleGenerateAISuggestions}
              disabled={isGeneratingAI}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isGeneratingAI ? (
                <>
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generar con IA
                </>
              )}
            </button>
          </div>
          <textarea
            value={aiSuggestions}
            onChange={(e) => setAiSuggestions(e.target.value)}
            className="w-full bg-[#1f2c34] text-white text-sm px-2 py-2 rounded border border-blue-500/30 focus:border-blue-400 focus:outline-none"
            rows={5}
            placeholder="Haz clic en 'Generar con IA' para obtener recomendaciones médicas personalizadas basadas en los datos del paciente..."
          />
          <p className="text-xs text-blue-400/70 mt-1">
            Estas sugerencias se concatenarán automáticamente con las recomendaciones médicas adicionales al guardar
          </p>
        </div>

        {/* 7. CONCEPTO FINAL */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Concepto Final</label>
          <select
            value={mdConceptoFinal}
            onChange={(e) => setMdConceptoFinal(e.target.value)}
            className="w-full bg-[#1f2c34] text-white text-sm px-2 py-2 rounded border border-gray-600 focus:border-[#00a884] focus:outline-none"
          >
            <option value="">Seleccione una opción</option>
            {data.codEmpresa?.toUpperCase() === 'SIIGO' ? (
              <>
                <option value="APTO">APTO</option>
                <option value="Presenta restricciones médico-laborales actualmente incompatibles con las exigencias del cargo evaluado.">Presenta restricciones médico-laborales actualmente incompatibles con las exigencias del cargo evaluado.</option>
                <option value="APLAZADO">APLAZADO</option>
                <option value="NO PRESENTA DETERIORO FÍSICO POR ACTIVIDAD LABORAL">NO PRESENTA DETERIORO FÍSICO POR ACTIVIDAD LABORAL</option>
              </>
            ) : (
              <>
                <option value="APTO">APTO</option>
                <option value="APTO CON RECOMENDACIONES">APTO CON RECOMENDACIONES</option>
                <option value="Apto con recomendaciones y ajustes razonables para la discapacidad que presenta">Apto con recomendaciones y ajustes razonables para la discapacidad que presenta</option>
                <option value="APTO PARA MANIPULACIÓN DE ALIMENTOS">APTO PARA MANIPULACIÓN DE ALIMENTOS</option>
                <option value="APTO PARA TRABAJO EN ALTURAS">APTO PARA TRABAJO EN ALTURAS</option>
                <option value="APTO PARA TRABAJO EN ALTURAS Y ESPACIOS CONFINADOS">APTO PARA TRABAJO EN ALTURAS Y ESPACIOS CONFINADOS</option>
                <option value="APTO PARA TRABAJO EN ALTURAS ESPACIOS CONFINADOS Y RIESGO ELECTRICO">APTO PARA TRABAJO EN ALTURAS ESPACIOS CONFINADOS Y RIESGO ELECTRICO</option>
                <option value="APLAZADO">APLAZADO</option>
                <option value="Presenta restricciones médico-laborales actualmente incompatibles con las exigencias del cargo evaluado.">Presenta restricciones médico-laborales actualmente incompatibles con las exigencias del cargo evaluado.</option>
                <option value="NO PRESENTA DETERIORO FÍSICO POR ACTIVIDAD LABORAL">NO PRESENTA DETERIORO FÍSICO POR ACTIVIDAD LABORAL</option>
                <option value="Puede realizar actividades escolares y grupales">Puede realizar actividades escolares y grupales</option>
              </>
            )}
          </select>
        </div>

        </div>
      </div>

      </div>
      {/* Cierre del contenido scrollable */}

      {/* Botón Guardar - Footer fijo */}
      <div className="border-t border-gray-700 p-4 bg-[#1f2c34]">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-[#00a884] text-white px-6 py-3 rounded-lg hover:bg-[#008f6f] transition font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg"
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </span>
          ) : (
            'Guardar Historia Clínica'
          )}
        </button>
      </div>
    </div>
  );
};
