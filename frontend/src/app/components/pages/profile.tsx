import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { User, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function Profile() {
  const { user, login } = useAuth();
  
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState(user?.profile_picture_url || '');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for simple base64
        toast.error("Image too large. Please select an image under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updateData: any = {};
      if (username !== user?.username) updateData.username = username;
      if (password) updateData.password = password;
      if (profilePic !== user?.profile_picture_url) updateData.profile_picture_url = profilePic;
      
      if (Object.keys(updateData).length === 0) {
        toast.info("No changes to update.");
        setLoading(false);
        return;
      }

      const updatedUser = await api.users.update(updateData);
      
      // Update local auth context
      if (user) {
        login({
          ...user,
          username: updatedUser.username,
          profile_picture_url: updatedUser.profile_picture_url
        });
      }
      
      toast.success("Profile updated successfully!");
      setPassword(''); // clear password field
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-800/50 p-6 backdrop-blur-xl">
        <form onSubmit={handleUpdate} className="space-y-6">
          
          <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
            <div className="relative size-24 shrink-0">
              {profilePic ? (
                <img 
                  src={profilePic} 
                  alt="Profile" 
                  className="size-full rounded-full object-cover border-2 border-cyan-500"
                />
              ) : (
                <div className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
                  <User className="size-10" />
                </div>
              )}
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 flex size-8 cursor-pointer items-center justify-center rounded-full bg-slate-700 border border-white/20 text-white hover:bg-slate-600 transition-colors shadow-lg"
              >
                <Camera className="size-4" />
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{user?.username}</h2>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="space-y-2">
              <Label className="text-gray-300">Username</Label>
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-cyan-500"
                placeholder="New username"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">New Password</Label>
              <Input 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-cyan-500"
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-400 hover:to-teal-400"
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
