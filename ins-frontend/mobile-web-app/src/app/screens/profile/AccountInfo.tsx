import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { usersService, User } from '@/services';
import { ArrowLeft, Camera, Mail, Phone, MapPin, Loader2, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';

// Normalize UserProfile (has currentMode) to User (has mode) for AuthContext
const toAuthUser = (profile: any): User => ({
  id: profile.id,
  email: profile.email,
  firstName: profile.firstName,
  lastName: profile.lastName,
  displayName: profile.displayName || `${profile.firstName} ${profile.lastName}`,
  phone: profile.phone,
  avatarUrl: profile.avatarUrl,
  mode: profile.mode || profile.currentMode || 'client',
  isProvider: profile.isProvider ?? false,
  isEmailVerified: profile.isEmailVerified,
  createdAt: profile.createdAt,
});

export default function AccountInfo() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
    location: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  // Prevent re-fetching from overwriting the form after saving
  const profileLoadedRef = useRef(false);
  // Track the phone value as loaded from the server (to detect real changes)
  const loadedPhoneRef = useRef<string>('');

  // Load full profile once on mount
  useEffect(() => {
    if (profileLoadedRef.current) return;
    profileLoadedRef.current = true;

    usersService.getMe().then((profile) => {
      const phone = profile.phone || '';
      loadedPhoneRef.current = phone;
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone,
        location: profile.city ? `${profile.city}${profile.state ? `, ${profile.state}` : ''}` : '',
      });
    }).catch(() => {
      // Fall back to auth context user data — already set in initial state
    }).finally(() => {
      setLoadingProfile(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveChanges = useCallback(async () => {
    setSaveStatus('saving');
    setSaveError(null);

    try {
      const updated = await usersService.updateMe({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      // Update the auth cache immediately with the name changes — do this before
      // the phone update so a phone error doesn't leave the name stale in the UI.
      let newPhone = updated.phone ?? loadedPhoneRef.current;
      updateUser({ ...toAuthUser(updated), phone: newPhone });

      // SMS/phone verification disabled — updatePhone commented out
      // if (formData.phone !== loadedPhoneRef.current) {
      //   await usersService.updatePhone(formData.phone);
      //   loadedPhoneRef.current = formData.phone;
      //   newPhone = formData.phone;
      //   updateUser({ ...toAuthUser(updated), phone: newPhone });
      // }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save changes';
      setSaveError(msg);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  }, [formData, updateUser]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/profile')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold">Account Information</h1>
        </div>
        {loadingProfile && (
          <Loader2 className="size-4 animate-spin text-gray-400" />
        )}
        {saveStatus === 'saving' && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="size-4 animate-spin" />
            Saving...
          </div>
        )}
        {saveStatus === 'saved' && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="size-4" />
            Saved
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar className="size-24">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="object-cover w-full h-full" />
              ) : (
                <AvatarFallback className="bg-blue-500 text-white text-2xl">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              )}
            </Avatar>
            <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border hover:bg-gray-50">
              <Camera className="size-4" />
            </button>
          </div>
          <Button variant="link" size="sm">
            Change Photo
          </Button>
        </div>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">Personal Information</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50 pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">Contact support to change email</p>
              </div>

              {/* Phone Number field — SMS disabled, will be re-enabled when Twilio is configured
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="bg-white pl-10"
                  />
                </div>
              </div>
              */}

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="location"
                    placeholder="San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="bg-white pl-10"
                  />
                </div>
              </div>
            </div>

            {saveError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="size-4 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <Button
              className="w-full min-h-[44px]"
              onClick={saveChanges}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? (
                <><Loader2 className="size-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Account Status</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Email Verified</span>
                <span className={user?.isEmailVerified ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                  {user?.isEmailVerified ? '✓ Verified' : 'Pending'}
                </span>
              </div>
              {/* Phone Verified — SMS disabled
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Phone Verified</span>
                <span className="text-gray-400 font-medium">Not verified</span>
              </div>
              */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Account Type</span>
                <span className="font-medium">Standard</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold text-red-600">Danger Zone</h3>
            <p className="text-sm text-gray-600">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button variant="destructive" className="w-full">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
