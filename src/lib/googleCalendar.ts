import { google } from "googleapis";

type OAuthTokens = {
  access_token: string | null;
  refresh_token: string | null;
};

export function createOAuth2Client(tokens: OAuthTokens) {
  const client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID!,
    process.env.AUTH_GOOGLE_SECRET!,
  );
  client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });
  return client;
}
