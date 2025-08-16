interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  description: string;
}

interface YouTubeSearchResponse {
  videos: YouTubeVideo[];
  nextPageToken?: string;
}

class YouTubeAPIService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || '';
  }

  async searchVideos(query: string, maxResults = 10): Promise<YouTubeSearchResponse> {
    try {
      const searchParams = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults.toString(),
        key: this.apiKey,
      });

      const response = await fetch(`${this.baseUrl}/search?${searchParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'YouTube API error');
      }

      const videos = await Promise.all(
        data.items.map(async (item: any) => {
          const duration = await this.getVideoDuration(item.id.videoId);
          return {
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            duration,
            thumbnail: item.snippet.thumbnails.medium.url,
            description: item.snippet.description,
          };
        })
      );

      return {
        videos,
        nextPageToken: data.nextPageToken,
      };
    } catch (error) {
      console.error('YouTube search error:', error);
      // Return mock data for development
      return this.getMockResults(query);
    }
  }

  private async getVideoDuration(videoId: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/videos?part=contentDetails&id=${videoId}&key=${this.apiKey}`
      );
      const data = await response.json();
      
      if (data.items?.[0]?.contentDetails?.duration) {
        return this.formatDuration(data.items[0].contentDetails.duration);
      }
    } catch (error) {
      console.error('Error getting video duration:', error);
    }
    return '0:00';
  }

  private formatDuration(isoDuration: string): string {
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1]?.replace('H', '') || '0');
    const minutes = parseInt(match[2]?.replace('M', '') || '0');
    const seconds = parseInt(match[3]?.replace('S', '') || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private getMockResults(query: string): YouTubeSearchResponse {
    return {
      videos: [
        {
          id: 'mock1',
          title: `${query} - Epic Music Mix`,
          channel: 'Epic Music Channel',
          duration: '3:45',
          thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjRkYwMDAwIi8+Cjx0ZXh0IHg9IjYwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+WW91VHViZTwvdGV4dD4KPC9zdmc+',
          description: `High-quality ${query} music perfect for background listening`,
        },
        {
          id: 'mock2',
          title: `${query} Playlist - Best Hits`,
          channel: 'Music Hits',
          duration: '2:30',
          thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjRkYwMDAwIi8+Cjx0ZXh0IHg9IjYwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+WW91VHViZTwvdGV4dD4KPC9zdmc+',
          description: `Popular ${query} songs compilation`,
        },
      ],
    };
  }

  async getVideoInfo(videoId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/videos?part=snippet,contentDetails&id=${videoId}&key=${this.apiKey}`
      );
      const data = await response.json();
      
      if (data.items?.[0]) {
        const video = data.items[0];
        return {
          id: videoId,
          title: video.snippet.title,
          channel: video.snippet.channelTitle,
          duration: this.formatDuration(video.contentDetails.duration),
          thumbnail: video.snippet.thumbnails.medium.url,
          description: video.snippet.description,
        };
      }
    } catch (error) {
      console.error('Error getting video info:', error);
    }
    return null;
  }

  getEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&rel=0`;
  }

  async extractAudioUrl(videoId: string): Promise<string | null> {
    // In a real implementation, you would use youtube-dl or similar
    // For now, return the embed URL for iframe integration
    return this.getEmbedUrl(videoId);
  }
}

export const youtubeAPI = new YouTubeAPIService();
export type { YouTubeVideo, YouTubeSearchResponse };