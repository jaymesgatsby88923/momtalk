export type SignupCredentials = {
  display_name: string;
  email: string;
  password: string;
};

let credentials: SignupCredentials | null = null;

export function setSignupCredentials(next: SignupCredentials) {
  credentials = next;
}

export function getSignupCredentials(): SignupCredentials | null {
  return credentials;
}

export function clearSignupCredentials() {
  credentials = null;
}
