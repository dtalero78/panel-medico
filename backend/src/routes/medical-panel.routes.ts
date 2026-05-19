import { Router } from 'express';
import medicalPanelController from '../controllers/medical-panel.controller';

const router = Router();

// Estadísticas del día para un médico
router.get('/stats/:medicoCode', medicalPanelController.getDailyStats);

// Lista paginada de pacientes pendientes
router.get('/patients/pending/:medicoCode', medicalPanelController.getPendingPatients);

// Búsqueda de paciente por documento
router.get('/patients/search/:documento', medicalPanelController.searchPatientByDocument);

// Detalles completos de un paciente
router.get('/patients/details/:documento', medicalPanelController.getPatientDetails);

// Resultados de laboratorios para una orden (HistoriaClinica._id)
router.get('/laboratorios/:ordenId', medicalPanelController.getLaboratorios);

// Resultados de audiometría (presencial o virtual) para una orden
router.get('/audiometria/:ordenId', medicalPanelController.getAudiometria);

// Resultados de visiometría presencial para una orden
router.get('/visiometria/:ordenId', medicalPanelController.getVisiometria);

// Resultados de visiometría virtual (Snellen/Landolt/Ishihara) para una orden
router.get('/visiometria-virtual/:ordenId', medicalPanelController.getVisiometriaVirtual);

// Marcar paciente como "No Contesta"
router.patch('/patients/:patientId/no-answer', medicalPanelController.markAsNoAnswer);

// Actualizar aprobación desde link de WhatsApp
router.get('/approve/:historiaId/:decision', (req, res) => medicalPanelController.updateAprobacion(req, res));

export default router;
