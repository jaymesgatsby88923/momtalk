export type ProfileResponse = {
  user_id: string;
  display_name: string;
  email: string;
  parent_type?: string | null;
  parent_stage?: string | null;
};

export type ProfileUpdateRequest = {
  display_name: string;
};

export type UserResponse = {
  user_id: string;
  display_name: string;
};
