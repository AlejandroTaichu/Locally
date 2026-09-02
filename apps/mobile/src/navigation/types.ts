import type { OtpChannel } from '../api/auth';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OtpVerify: { channel: OtpChannel; target: string };
};

export type AppStackParamList = {
  Onboarding: undefined;
  EventList: undefined;
  EventDetail: { eventId: string };
  CreateEvent: undefined;
  Profile: undefined;
};
