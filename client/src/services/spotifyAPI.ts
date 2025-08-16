interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  preview_url?: string;
  external_urls: {
    spotify: string;
  };
  image?: string;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  tracks_count: number;
  image?: string;
  external_urls: {
    spotify: string;
  };
}

interface SpotifySearchResponse {
  tracks: SpotifyTrack[];
  playlists: SpotifyPlaylist[];
}

class SpotifyAPIService {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private baseUrl = 'https://api.spotify.com/v1';

  constructor() {
    this.clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '';
  }

  async authenticate(): Promise<boolean> {
    try {
      // Check if we have a stored token
      const storedToken = localStorage.getItem('spotify_access_token');
      const storedRefresh = localStorage.getItem('spotify_refresh_token');
      
      if (storedToken) {
        this.accessToken = storedToken;
        this.refreshToken = storedRefresh;
        
        // Verify token is still valid
        const isValid = await this.verifyToken();
        if (isValid) return true;
      }

      // Start OAuth flow
      return this.startOAuthFlow();
    } catch (error) {
      console.error('Spotify authentication error:', error);
      return false;
    }
  }

  private async verifyToken(): Promise<boolean> {
    if (!this.accessToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (response.ok) return true;
      
      // Try to refresh token
      if (this.refreshToken) {
        return await this.refreshAccessToken();
      }
    } catch (error) {
      console.error('Token verification error:', error);
    }

    return false;
  }

  private startOAuthFlow(): boolean {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-library-read',
      'playlist-read-private',
      'playlist-read-collaborative',
      'streaming',
      'user-read-playback-state',
      'user-modify-playback-state',
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: `${window.location.origin}/spotify-callback`,
      scope: scopes.join(' '),
      state: crypto.randomUUID(),
    });

    window.open(
      `https://accounts.spotify.com/authorize?${params}`,
      'spotify-auth',
      'width=500,height=600'
    );

    return false;
  }

  async handleCallback(code: string): Promise<boolean> {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${window.location.origin}/spotify-callback`,
        }),
      });

      const data = await response.json();
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        
        if (this.accessToken) {
          localStorage.setItem('spotify_access_token', this.accessToken);
        }
        if (this.refreshToken) {
          localStorage.setItem('spotify_refresh_token', this.refreshToken);
        }
        
        return true;
      }
    } catch (error) {
      console.error('Spotify callback error:', error);
    }

    return false;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken || '',
        }),
      });

      const data = await response.json();
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        if (this.accessToken) {
          localStorage.setItem('spotify_access_token', this.accessToken);
        }
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    return false;
  }

  async search(query: string, types = ['track', 'playlist']): Promise<SpotifySearchResponse> {
    if (!this.accessToken) {
      return this.getMockResults(query);
    }

    try {
      const params = new URLSearchParams({
        q: query,
        type: types.join(','),
        limit: '10',
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();

      const tracks = data.tracks?.items?.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        album: track.album?.name || 'Unknown Album',
        duration: track.duration_ms,
        preview_url: track.preview_url,
        external_urls: track.external_urls,
        image: track.album?.images?.[1]?.url,
      })) || [];

      const playlists = data.playlists?.items?.map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description || '',
        tracks_count: playlist.tracks?.total || 0,
        external_urls: playlist.external_urls,
        image: playlist.images?.[0]?.url,
      })) || [];

      return { tracks, playlists };
    } catch (error) {
      console.error('Spotify search error:', error);
      return this.getMockResults(query);
    }
  }

  private getMockResults(query: string): SpotifySearchResponse {
    return {
      tracks: [
        {
          id: 'mock1',
          name: `${query} Song`,
          artist: 'Demo Artist',
          album: 'Demo Album',
          duration: 210000,
          external_urls: { spotify: '#' },
        },
        {
          id: 'mock2',
          name: `Another ${query} Track`,
          artist: 'Test Artist',
          album: 'Test Album',
          duration: 195000,
          external_urls: { spotify: '#' },
        },
      ],
      playlists: [
        {
          id: 'playlist1',
          name: `Best of ${query}`,
          description: `Top ${query} tracks`,
          tracks_count: 50,
          external_urls: { spotify: '#' },
        },
      ],
    };
  }

  async getUserPlaylists(): Promise<SpotifyPlaylist[]> {
    if (!this.accessToken) return [];

    try {
      const response = await fetch(`${this.baseUrl}/me/playlists?limit=50`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();
      
      return data.items?.map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description || '',
        tracks_count: playlist.tracks?.total || 0,
        external_urls: playlist.external_urls,
        image: playlist.images?.[0]?.url,
      })) || [];
    } catch (error) {
      console.error('Error getting user playlists:', error);
      return [];
    }
  }

  async playTrack(trackId: string, deviceId?: string): Promise<boolean> {
    if (!this.accessToken) return false;

    try {
      const body: any = {
        uris: [`spotify:track:${trackId}`],
      };

      if (deviceId) {
        body.device_id = deviceId;
      }

      const response = await fetch(`${this.baseUrl}/me/player/play`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      return response.ok;
    } catch (error) {
      console.error('Error playing track:', error);
      return false;
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
  }
}

export const spotifyAPI = new SpotifyAPIService();
export type { SpotifyTrack, SpotifyPlaylist, SpotifySearchResponse };