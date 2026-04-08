import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  let appUrl = process.env.APP_URL || new URL(request.url).origin;
  
  // Ensure https for .run.app domains
  if (appUrl.includes('.run.app') && appUrl.startsWith('http:')) {
    appUrl = appUrl.replace('http:', 'https:');
  }
  
  const redirectUri = `${appUrl}/api/auth/spotify/callback`;
  
  console.log('Spotify Auth URL Request:', { clientId: clientId ? 'set' : 'missing', redirectUri });

  if (!clientId) {
    return NextResponse.json({ error: 'SPOTIFY_CLIENT_ID not configured' }, { status: 500 });
  }

  const scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing streaming';
  const state = Math.random().toString(36).substring(7);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scope,
    state: state,
    show_dialog: 'true'
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  
  return NextResponse.json({ url: authUrl });
}
