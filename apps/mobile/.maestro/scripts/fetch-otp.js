// Reads the simulated OTP code from the API's dev-only debug endpoint.
// Requires the API to be running with ENABLE_TEST_ENDPOINTS=true, e.g.
// `pnpm --filter api run start:test` (see apps/mobile/.maestro/README.md).
const target = encodeURIComponent(output.otpTarget || output.email);
const response = http.get(`http://localhost:3000/auth/otp/debug?channel=email&target=${target}`);
output.otpCode = json(response.body).code;
