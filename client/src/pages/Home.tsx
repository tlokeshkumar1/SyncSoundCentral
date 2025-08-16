import { ArrowRight, Crown, Users, FolderSync, Smartphone, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from 'wouter';

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-dark-primary text-white relative overflow-hidden" data-testid="home-page">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-transparent to-secondary"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary rounded-full filter blur-3xl opacity-20"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-transparent">
              FolderSync Your
            </span>
            <br />
            <span>Sound Experience</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Transform multiple devices into a synchronized audio system. Create immersive surround sound experiences using your existing smartphones and tablets.
          </p>
        </section>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Host Room Card */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-2">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-accent to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Host a Room</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Create a new audio room and invite others to join your synchronized listening experience. You'll control the music and settings.
              </p>
              <Button 
                onClick={() => setLocation('/create-room')}
                className="w-full bg-gradient-to-r from-accent to-orange-600 hover:shadow-lg hover:shadow-accent/25 transition-all duration-300 py-4 rounded-2xl font-semibold"
                data-testid="button-create-room"
              >
                Create Room
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Join Room Card */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-2">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-secondary to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Join a Room</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Enter a 6-digit room code to join an existing audio session. FolderSync with friends and enjoy music together in perfect harmony.
              </p>
              <Button 
                onClick={() => setLocation('/join-room')}
                className="w-full bg-gradient-to-r from-secondary to-emerald-600 hover:shadow-lg hover:shadow-secondary/25 transition-all duration-300 py-4 rounded-2xl font-semibold"
                data-testid="button-join-room"
              >
                Join Room
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderSync className="w-6 h-6 text-primary" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Perfect FolderSync</h4>
            <p className="text-gray-400 text-sm">Audio synchronization within 50ms across all connected devices</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-6 h-6 text-secondary" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Any Device</h4>
            <p className="text-gray-400 text-sm">Works on smartphones, tablets, and computers - no special hardware needed</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Volume2 className="w-6 h-6 text-accent" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Surround Sound</h4>
            <p className="text-gray-400 text-sm">Automatic positioning creates immersive 5.1 and 7.1 surround experiences</p>
          </div>
        </div>
      </div>
    </div>
  );
}
