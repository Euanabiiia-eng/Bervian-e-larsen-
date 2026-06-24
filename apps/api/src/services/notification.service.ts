import logger from '../lib/logger';

export async function notifyPatient(
  pacienteId: string,
  title: string,
  body: string,
): Promise<void> {
  // Stub: FCM not yet configured. Log notification details.
  logger.info(
    `[PUSH] Paciente ${pacienteId} — Título: "${title}" — Corpo: "${body}"`,
  );
}

export async function notifyClinicStaff(
  clinicId: string,
  title: string,
  body: string,
): Promise<void> {
  // Stub: FCM not yet configured. Log notification details.
  logger.info(
    `[PUSH] Staff da clínica ${clinicId} — Título: "${title}" — Corpo: "${body}"`,
  );
}
