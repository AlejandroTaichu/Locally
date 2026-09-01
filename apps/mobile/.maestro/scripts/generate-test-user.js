// Generates unique register-flow input so repeated Maestro runs never collide
// on the API's unique email/phone constraints.
const now = Date.now();
output.displayName = 'Maestro Test';
output.email = `maestro-${now}@example.com`;
output.phone = `+9055${String(now).slice(-7)}`;
