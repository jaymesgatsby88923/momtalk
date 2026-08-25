export type LoginRequest = {
  email: string;
  password: string;
};

export type SignUpRequest = {
  display_name: string;
  email: string;
  password: string;
  parent_type?: string;
  birth_date?: string;
  due_date?: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
};

export type SignUpResponse = {
  access_token?: string | null;
  refresh_token?: string | null;
};
