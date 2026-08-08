export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Communities: undefined;
  Post: undefined;
  Messages: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AuthStackParamList, MainTabParamList {}
  }
}
