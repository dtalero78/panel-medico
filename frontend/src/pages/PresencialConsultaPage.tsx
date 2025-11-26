import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { MedicalHistoryPanel } from '../components/MedicalHistoryPanel';
import { LocalPosturalAnalysis } from '../components/LocalPosturalAnalysis';

export const PresencialConsultaPage = () => {
  const { consultaId } = useParams<{ consultaId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [doctorName, setDoctorName] = useState('');
  const [isInConsulta, setIsInConsulta] = useState(false);
  const [showPosturalAnalysis, setShowPosturalAnalysis] = useState(false);
  const appendToObservacionesRef = useRef<((text: string) => void) | null>(null);

  // Extraer parámetros de la URL
  const doctorParam = searchParams.get('doctor');
  const historiaIdParam = searchParams.get('documento');
  const pacienteParam = searchParams.get('paciente');

  // Auto-llenar nombre del doctor si viene en la URL
  useEffect(() => {
    if (doctorParam) {
      setDoctorName(doctorParam);
    }
  }, [doctorParam]);

  const handleJoinConsulta = () => {
    if (doctorName.trim()) {
      setIsInConsulta(true);
    }
  };

  const handleLeaveConsulta = () => {
    if (confirm('¿Está seguro que desea salir de la consulta?')) {
      setIsInConsulta(false);
      navigate('/panel-medico');
    }
  };

  const handleTogglePosturalAnalysis = () => {
    setShowPosturalAnalysis(!showPosturalAnalysis);
  };

  // Callback para agregar resultados del análisis postural al historial
  const handlePosturalResults = (results: string) => {
    if (appendToObservacionesRef.current) {
      appendToObservacionesRef.current(results);
    }
  };

  // Vista de consulta activa
  if (isInConsulta && consultaId) {
    return (
      <div className="h-screen bg-[#0b141a] flex flex-col">
        {/* Header */}
        <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-4">
            <img src="/logoBlanco.png" alt="BSL Logo" className="h-8 w-auto" />
            <div>
              <h1 className="text-white font-semibold">Consulta Presencial</h1>
              <p className="text-gray-400 text-xs">Dr. {doctorName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Badge de tipo de consulta */}
            <div className="flex items-center gap-1 bg-purple-500/20 px-3 py-1.5 rounded-full border border-purple-500/50">
              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <span className="text-purple-400 text-sm font-medium">Presencial</span>
            </div>

            {/* Nombre del paciente */}
            {pacienteParam && (
              <div className="text-white text-sm">
                <span className="text-gray-400">Paciente: </span>
                <span className="font-semibold">{pacienteParam}</span>
              </div>
            )}

            {/* Botón para terminar consulta */}
            <button
              onClick={handleLeaveConsulta}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              Terminar Consulta
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex overflow-hidden">
          {showPosturalAnalysis ? (
            <>
              {/* Cuando la cámara está activa: Layout dividido */}
              {/* Área principal - Análisis postural */}
              <div className="flex-1 flex flex-col">
                {/* Botón para cerrar análisis postural */}
                <div className="p-4 border-b border-gray-700 bg-[#1f2c34]">
                  <button
                    onClick={handleTogglePosturalAnalysis}
                    className="px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    Cerrar Análisis Postural
                  </button>
                </div>

                {/* Área de análisis postural */}
                <div className="flex-1 overflow-hidden">
                  <LocalPosturalAnalysis
                    onResultsReady={handlePosturalResults}
                    patientName={pacienteParam || 'Paciente'}
                  />
                </div>
              </div>

              {/* Panel lateral - Historia clínica (450px) */}
              <div className="w-[450px] border-l border-gray-700 flex-shrink-0 overflow-hidden">
                <MedicalHistoryPanel
                  historiaId={historiaIdParam || consultaId}
                  onAppendToObservaciones={(appendFn) => {
                    appendToObservacionesRef.current = appendFn;
                  }}
                />
              </div>
            </>
          ) : (
            <>
              {/* Cuando la cámara NO está activa: Panel grande con botón pequeño */}
              {/* Barra lateral con botón de análisis */}
              <div className="w-[200px] flex flex-col bg-[#1f2c34] border-r border-gray-700 p-4">
                <button
                  onClick={handleTogglePosturalAnalysis}
                  className="px-4 py-3 rounded-xl font-semibold transition flex flex-col items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-center"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  <span className="text-sm">Iniciar Análisis Osteomuscular</span>
                </button>

                <div className="mt-6 text-center">
                  <p className="text-gray-400 text-xs">
                    Use la cámara para evaluar la postura del paciente
                  </p>
                </div>
              </div>

              {/* Panel principal - Historia clínica (ocupa el resto del espacio) */}
              <div className="flex-1 overflow-hidden">
                <MedicalHistoryPanel
                  historiaId={historiaIdParam || consultaId}
                  onAppendToObservaciones={(appendFn) => {
                    appendToObservacionesRef.current = appendFn;
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Vista de login/entrada
  return (
    <div className="min-h-screen bg-[#0b141a] flex items-center justify-center p-4">
      <div className="bg-[#1f2c34] rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src="/logoBlanco.png"
              alt="BSL Logo"
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
            Consulta Presencial
          </h1>
          <p className="text-gray-400 text-sm">Panel del Médico</p>
        </div>

        {/* Badge de tipo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-500/50">
            <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span className="text-purple-400 font-medium">Consulta Presencial</span>
          </div>
        </div>

        {/* Información del paciente */}
        {pacienteParam && (
          <div className="bg-[#2a3942] rounded-xl p-4 mb-6 border border-gray-600">
            <p className="text-xs text-gray-400 mb-2">Paciente</p>
            <p className="text-white font-semibold text-base">{pacienteParam}</p>
          </div>
        )}

        {/* Formulario del médico */}
        <div className="space-y-5">
          <div>
            <label
              htmlFor="doctorName"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Código de Médico
            </label>
            <input
              type="text"
              id="doctorName"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Ingresa tu código"
              className="w-full px-4 py-3 bg-[#2a3942] text-white border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition placeholder-gray-500"
              required
            />
          </div>

          <button
            onClick={handleJoinConsulta}
            disabled={!doctorName.trim()}
            className="w-full bg-purple-600 text-white px-6 py-3.5 rounded-xl hover:bg-purple-700 transition font-semibold shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Iniciar Consulta Presencial
          </button>

          <div className="bg-[#2a3942] rounded-xl p-4 border border-gray-600">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-300 font-medium mb-1">Información</p>
                <p className="text-xs text-gray-400">
                  Esta es una consulta presencial. El paciente se encuentra físicamente presente.
                  Tendrá acceso al historial médico y al análisis osteomuscular usando la cámara de su computador.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Datos protegidos</span>
          </div>
        </div>
      </div>
    </div>
  );
};
