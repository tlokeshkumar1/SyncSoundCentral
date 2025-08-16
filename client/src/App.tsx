import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SocketProvider } from "./contexts/SocketContext";
import { AudioProvider } from "./contexts/AudioContext";
import { AudioStreamProvider } from "./contexts/AudioStreamContext";
import { RoomProvider } from "./contexts/RoomContext";
import Home from "./pages/Home";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import HostDashboard from "./pages/HostDashboard";
import ParticipantDashboard from "./pages/ParticipantDashboard";
import NotFound from "@/pages/not-found";

// Header component
function Header() {
  return (
    <header className="relative z-50 bg-dark-secondary/80 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <i className="fas fa-broadcast-tower text-white text-lg"></i>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SyncSound
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <i className="fas fa-cog text-gray-400"></i>
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-orange-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Mobile navigation component
function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-secondary/90 backdrop-blur-lg border-t border-white/10 px-4 py-3 md:hidden z-50">
      <div className="flex items-center justify-around">
        <button className="flex flex-col items-center space-y-1 text-primary">
          <i className="fas fa-home text-lg"></i>
          <span className="text-xs">Home</span>
        </button>
        <button className="flex flex-col items-center space-y-1 text-gray-400">
          <i className="fas fa-users text-lg"></i>
          <span className="text-xs">Room</span>
        </button>
        <button className="flex flex-col items-center space-y-1 text-gray-400">
          <i className="fas fa-play text-lg"></i>
          <span className="text-xs">Player</span>
        </button>
        <button className="flex flex-col items-center space-y-1 text-gray-400">
          <i className="fas fa-cog text-lg"></i>
          <span className="text-xs">Settings</span>
        </button>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create-room" component={CreateRoom} />
      <Route path="/join-room" component={JoinRoom} />
      <Route path="/host-dashboard" component={HostDashboard} />
      <Route path="/participant-dashboard" component={ParticipantDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <AudioProvider>
          <AudioStreamProvider>
            <RoomProvider>
            <TooltipProvider>
              <div className="min-h-screen bg-dark-primary font-inter relative overflow-hidden">
                <Header />
                <main className="relative">
                  <Router />
                </main>
                <MobileNav />
                <Toaster />
              </div>
            </TooltipProvider>
            </RoomProvider>
          </AudioStreamProvider>
        </AudioProvider>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;
