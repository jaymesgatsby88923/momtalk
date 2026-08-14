export type Affirmation = {
  affirmation_id: string;
  message: string;
  subtext: string | null;
};

export type SaveAffirmationRequest = {
  affirmation_id: string;
};
