import { useState, useEffect } from 'react';
import { Search, Play, Pause, SkipForward, SkipBack, Volume2, ExternalLink } from 'lucide-react';
import { youtubeAPI } from '../services/youtubeAPI';
import { spotifyAPI } from '../services/spotifyAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  preview_url?: string;
}

export function AppIntegrationHub() {
  const [activeTab, setActiveTab] = useState('youtube');
  const [searchQuery, setSearchQuery] = useState('');
  const [youtubeResults, setYoutubeResults] = useState<YouTubeVideo[]>([]);
  const [spotifyResults, setSpotifyResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Enhanced demo data that updates based on search query
  const mockYouTubeResults: YouTubeVideo[] = [
    {
      id: 'demo1',
      title: `${searchQuery || 'Popular'} Music - Epic Collection`,
      channel: 'SyncSound Demo',
      duration: '3:45',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRkYwMDAwIi8+Cjx0ZXh0IHg9IjE2MCIgeT0iOTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiPllvdVR1YmU8L3RleHQ+Cjwvc3ZnPg=='
    },
    {
      id: 'demo2',
      title: `${searchQuery || 'Trending'} Hits Playlist`,
      channel: 'Music Hub',  
      duration: '2:30',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRkYwMDAwIi8+Cjx0ZXh0IHg9IjE2MCIgeT0iOTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiPllvdVR1YmU8L3RleHQ+Cjwvc3ZnPg=='
    },
    {
      id: 'demo3',
      title: `Best ${searchQuery || 'Music'} Mix 2025`,
      channel: 'Demo Channel',
      duration: '4:12',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRkYwMDAwIi8+Cjx0ZXh0IHg9IjE2MCIgeT0iOTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiPllvdVR1YmU8L3RleHQ+Cjwvc3ZnPg=='
    },
  ];

  const mockSpotifyTracks: SpotifyTrack[] = [
    {
      id: '1',
      name: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      duration: 200000,
    },
    {
      id: '2',
      name: 'Watermelon Sugar',
      artist: 'Harry Styles',
      album: 'Fine Line',
      duration: 174000,
    },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      if (activeTab === 'youtube') {
        const results = await youtubeAPI.searchVideos(searchQuery, 5);
        setYoutubeResults(results.videos.map(video => ({
          id: video.id,
          title: video.title,
          channel: video.channel,
          duration: video.duration,
          thumbnail: video.thumbnail
        })));
      } else if (activeTab === 'spotify') {
        const results = await spotifyAPI.search(searchQuery);
        setSpotifyResults(results.tracks);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to mock data on error
      if (activeTab === 'youtube') {
        setYoutubeResults(mockYouTubeResults);
      } else if (activeTab === 'spotify') {
        setSpotifyResults(mockSpotifyTracks);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSource = (id: string, type: string) => {
    setSelectedSource(`${type}:${id}`);
    
    // Get the selected item details
    let selectedItem: any;
    if (type === 'youtube') {
      selectedItem = youtubeResults.find(v => v.id === id) || mockYouTubeResults.find(v => v.id === id);
    } else if (type === 'spotify') {
      selectedItem = spotifyResults.find(t => t.id === id) || mockSpotifyTracks.find(t => t.id === id);
    }
    
    // Broadcast current song update to receivers via context/socket
    if (selectedItem && window.socketInstance) {
      window.socketInstance.send(JSON.stringify({
        type: 'current-song-update',
        title: selectedItem.title || selectedItem.name,
        artist: selectedItem.channel || selectedItem.artist,
        thumbnail: selectedItem.thumbnail
      }));
    }
    
    console.log(`Selected ${type} source:`, id);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-lg" data-testid="app-integration-hub">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Audio Sources</h3>
          <Badge variant="outline" className="text-primary border-primary">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </Badge>
        </div>

        {/* Search Bar */}
        <div className="flex space-x-2 mb-6">
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-white/5 border-white/10 rounded-xl"
            data-testid="search-input"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25"
            data-testid="search-button"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Source Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10 rounded-xl">
            <TabsTrigger 
              value="youtube" 
              className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
              data-testid="tab-youtube"
            >
              <i className="fab fa-youtube mr-2"></i>
              YouTube
            </TabsTrigger>
            <TabsTrigger 
              value="spotify" 
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
              data-testid="tab-spotify"
            >
              <i className="fab fa-spotify mr-2"></i>
              Spotify
            </TabsTrigger>
            <TabsTrigger 
              value="chrome" 
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
              data-testid="tab-chrome"
            >
              <i className="fab fa-chrome mr-2"></i>
              Browser
            </TabsTrigger>
            <TabsTrigger 
              value="drive" 
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"
              data-testid="tab-drive"
            >
              <i className="fab fa-google-drive mr-2"></i>
              Drive
            </TabsTrigger>
          </TabsList>

          {/* YouTube Content */}
          <TabsContent value="youtube" className="space-y-4">
            <div className="space-y-3">
              {isSearching ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-400">Searching YouTube...</p>
                </div>
              ) : youtubeResults.length > 0 ? (
                youtubeResults.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => handleSelectSource(video.id, 'youtube')}
                    data-testid={`youtube-result-${video.id}`}
                  >
                    <div className="w-16 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                      <i className="fab fa-youtube text-white"></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium line-clamp-2">{video.title}</h4>
                      <p className="text-sm text-gray-400">{video.channel} • {video.duration}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <i className="fab fa-youtube text-2xl text-red-400"></i>
                  </div>
                  <p className="text-gray-400">Search for YouTube videos to play</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Spotify Content */}
          <TabsContent value="spotify" className="space-y-4">
            <div className="space-y-3">
              {!isSearching && spotifyResults.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <i className="fab fa-spotify text-2xl text-green-400"></i>
                  </div>
                  <p className="text-gray-400 mb-4">Connect your Spotify account</p>
                  <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg hover:shadow-green-500/25">
                    <i className="fab fa-spotify mr-2"></i>
                    Connect Spotify
                  </Button>
                </div>
              ) : (
                spotifyResults.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => handleSelectSource(track.id, 'spotify')}
                    data-testid={`spotify-result-${track.id}`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <i className="fas fa-music text-white"></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{track.name}</h4>
                      <p className="text-sm text-gray-400">{track.artist} • {formatDuration(track.duration)}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Chrome Content */}
          <TabsContent value="chrome" className="space-y-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fab fa-chrome text-2xl text-blue-400"></i>
              </div>
              <p className="text-gray-400 mb-4">Capture audio from browser tabs</p>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/25">
                <i className="fab fa-chrome mr-2"></i>
                Install Extension
              </Button>
            </div>
          </TabsContent>

          {/* Google Drive Content */}
          <TabsContent value="drive" className="space-y-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fab fa-google-drive text-2xl text-yellow-400"></i>
              </div>
              <p className="text-gray-400 mb-4">Access your Google Drive music files</p>
              <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:shadow-lg hover:shadow-yellow-500/25">
                <i className="fab fa-google mr-2"></i>
                Connect Google Drive
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Current Source Display */}
        {selectedSource && (
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Ready to Stream</p>
                    <p className="text-sm text-gray-400">Source: {selectedSource.split(':')[0]}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8"
                    data-testid="play-selected-source"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}