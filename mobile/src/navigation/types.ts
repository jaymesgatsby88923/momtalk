export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  Onboarding: undefined;
};

export type CommunitiesStackParamList = {
  CommunitiesList: undefined;
  CommunityDetail: {
    communityId: string;
    communityName?: string;
    isJoined?: boolean;
  };
  PostDetail: {
    postId: string;
  };
};

export type HomeStackParamList = {
  HomeFeed: undefined;
  PostDetail: {
    postId: string;
  };
};

export type RestoreStackParamList = {
  RestoreHome: undefined;
  RestoreJournal: undefined;
  JournalEntryDetail: {
    journalEntryId: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Communities: undefined;
  Post: undefined;
  Restore: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList
      extends AuthStackParamList,
        MainTabParamList,
        CommunitiesStackParamList,
        HomeStackParamList,
        RestoreStackParamList {}
  }
}
