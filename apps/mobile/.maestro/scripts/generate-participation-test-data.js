const now = Date.now();
const suffix = String(now);

output.organizerName = 'Maestro Organizatör';
output.organizerEmail = `maestro-organizer-${suffix}@example.com`;
output.organizerPhone = `+9054${suffix.slice(-8)}`;
output.organizerPassword = 'MaestroOrg1234';
output.participantName = 'Maestro Katılımcı';
output.participantEmail = `maestro-participant-${suffix}@example.com`;
output.participantPhone = `+9053${suffix.slice(-8)}`;
output.participantPassword = 'MaestroPart1234';
output.eventTitle = `Maestro Onay ${suffix.slice(-6)}`;
output.otpTarget = output.organizerEmail;
