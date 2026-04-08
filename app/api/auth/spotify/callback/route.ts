import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    let appUrl = process.env.APP_URL || new URL(request.url).origin;

    // Ensure https for .run.app domains
    if (appUrl.includes('.run.app') && appUrl.startsWith('http:')) {
      appUrl = appUrl.replace('http:', 'https:');
    }

    const redirectUri = `${appUrl}/api/auth/spotify/callback`;

    console.log('Spotify Callback Request:', { clientId: clientId ? 'set' : 'missing', redirectUri, code: code ? 'received' : 'missing' });

    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured');
    }

    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Send success message to parent window and close popup
    return new NextResponse(`
      <script>
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'SPOTIFY_AUTH_SUCCESS', 
            accessToken: '${access_token}',
            refreshToken: '${refresh_token}',
            expiresIn: ${expires_in}
          }, '*');
          window.close();
        } else {
          window.location.href = '/';
        }
      </script>
      <p>Authentication successful. This window should close automatically.</p>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (err: any) {
    console.error('Spotify token exchange error:', err.response?.data || err.message);
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }
}
