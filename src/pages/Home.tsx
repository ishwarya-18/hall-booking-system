import { AppLayout } from '@/components/layout/AppLayout';
import homeLogo from '@/assets/home-logo.png';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, CalendarCheck, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Book a Hall',
      description: 'Reserve a seminar hall for your event',
      icon: CalendarDays,
      path: '/hall-booking',
      color: 'bg-primary',
    },
    {
      title: 'Check Availability',
      description: 'View hall availability calendar',
      icon: CalendarCheck,
      path: '/hall-availability',
      color: 'bg-accent',
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <img
            src={homeLogo}
            alt="Bannari Amman Institute of Technology"
            className="h-48 mx-auto mb-6 drop-shadow-lg"
          />
          <h1 className="text-3xl font-bold text-primary mb-2">
            Welcome{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Hall Booking Management System
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {quickActions.map((action) => (
            <Card
              key={action.path}
              className="glass-card cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl group"
              onClick={() => navigate(action.path)}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`${action.color} p-4 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-card-foreground">
                    {action.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Available Halls Info */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold text-card-foreground">
                Available Halls
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                'Main Auditorium Hall',
                'Vedhanayagam Hall',
                'ECE Seminar Hall',
                'SF Seminar Hall',
              ].map((hall) => (
                <div
                  key={hall}
                  className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-sm font-medium">{hall}</span>
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-4"
              variant="outline"
              onClick={() => navigate('/hall-availability')}
            >
              View All Availability
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
