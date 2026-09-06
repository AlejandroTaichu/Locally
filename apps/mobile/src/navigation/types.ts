import type { OtpChannel } from '../api/auth';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OtpVerify: { channel: OtpChannel; target: string };
};

export type AppTabParamList = {
  KesfetTab: undefined;
  EtkinliklerimTab: undefined;
  ProfilTab: undefined;
};

export type AppStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  EventDetail: { eventId: string };
  CreateEvent: undefined;
  MapExplore: undefined;
  EditPersonalInfo: undefined;
  Preferences: undefined;
  EditInterests: undefined;
  Legal: undefined;
};
