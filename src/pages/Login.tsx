import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Phone, Mail, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import homeLogo from '@/assets/home-logo.png';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [phoneError, setPhoneError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const validatePhone = (phone: string) => {
    if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      setPhoneError('Phone number must be exactly 10 digits.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'phone') {
      validatePhone(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && phoneError) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the phone number error before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Login API call
        const response = await apiService.login({
          email: formData.email,
          password: formData.password,
        });
        
        login(response.token);
        
        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in.',
        });
        
        navigate('/home');
      } else {
        // Signup API call
        await apiService.signup({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        });
        
        toast({
          title: 'Account created!',
          description: 'Your account has been created. Please login.',
        });
        
        setIsLogin(true);
        setFormData({ name: '', email: '', phone: '', password: '' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <img
            src={homeLogo}
            alt="Bannari Amman Institute of Technology"
            className="h-32 mx-auto mb-4"
          />
        </div>

        <Card className="glass-card border-2 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary flex items-center justify-center gap-2">
              {isLogin ? <LogIn className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
              {isLogin ? 'Login to Your Account' : 'Create Your Account'}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? 'Manage your hall reservations'
                : 'Join us to book seminar halls'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="transition-all focus:scale-[1.01]"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="transition-all focus:scale-[1.01]"
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required={!isLogin}
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                    className="transition-all focus:scale-[1.01]"
                  />
                  {phoneError && (
                    <p className="text-sm text-destructive">{phoneError}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="transition-all focus:scale-[1.01]"
                />
              </div>

              <Button
                type="submit"
                className="w-full transition-all hover:scale-[1.02]"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  'Processing...'
                ) : isLogin ? (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-1 font-semibold text-primary hover:underline transition-colors"
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
