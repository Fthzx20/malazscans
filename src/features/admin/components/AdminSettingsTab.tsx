import React, { useState } from 'react';
import { Save, User, Key, Database, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../auth/store/authStore';
import { useNovelStore } from '../../novels/store/novelStore';
import { CONFIG } from '../../../config';

export const AdminSettingsTab: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuthStore();
  const { triggerToast } = useNovelStore();

  const [username, setUsername] = useState(currentUser?.username || 'Administrator');
  const [email, setEmail] = useState(currentUser?.email || CONFIG.ADMIN_EMAIL);
  const [password, setPassword] = useState('••••••••••••');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      triggerToast("Username and Email are required.");
      return;
    }
    if (currentUser) {
      setCurrentUser({ ...currentUser, username, email });
    }
    triggerToast("Admin profile settings saved.");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-xs font-mono text-white">
      {/* Left Column: Admin Profile Credentials */}
      <form onSubmit={handleSave} className="lg:col-span-5 border border-[#262626] bg-[#0F0F0F] p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
          <User className="w-5 h-5 text-[#FF3D00]" />
          <h3 className="text-base font-black uppercase tracking-tight">Profile Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#737373] uppercase font-bold block">Admin Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-[#737373] uppercase font-bold block">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-[#737373] uppercase font-bold block">Current Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#151515] border border-[#262626] p-3 text-[#737373] focus:outline-none"
              disabled
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#FF3D00] text-[#0A0A0A] font-bold py-3 uppercase hover:bg-white transition-colors cursor-pointer border-none flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Credentials</span>
          </button>
        </div>
      </form>

      {/* Right Column: DB Server Configurations & Security Alerts */}
      <div className="lg:col-span-7 space-y-6">
        {/* Database Migration Panel */}
        <div className="border border-[#262626] bg-[#0F0F0F] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
            <Database className="w-5 h-5 text-[#FF3D00]" />
            <h3 className="text-base font-black uppercase tracking-tight">Database Migration Panel</h3>
          </div>
          
          <div className="space-y-3">
            <p className="text-[#A3A3A3] leading-relaxed">
              Prepare the platform data structures for future server migrations (PostgreSQL / Supabase / Prisma). Clean, typed interfaces are configured inside types model files.
            </p>
            <div className="p-3 border border-[#262626] bg-[#151515] font-mono text-[10px] space-y-1">
              <div>DATABASE_DIALECT: <span className="text-[#FF3D00] font-bold">PostgreSQL</span></div>
              <div>PROVIDER: <span className="text-[#FF3D00] font-bold">Supabase DB</span></div>
              <div>ORM: <span className="text-[#FF3D00] font-bold">Prisma Client</span></div>
            </div>
            <button
              onClick={() => triggerToast("Database schema is managed via Prisma. Run 'npx prisma db push' to sync.")}
              className="border border-[#737373] hover:border-white text-white py-2.5 px-4 font-mono text-[10px] uppercase font-bold bg-transparent cursor-pointer"
            >
              View Schema Info
            </button>
          </div>
        </div>

        {/* Security Warnings */}
        <div className="border border-[#FF3D00]/20 bg-[#FF3D00]/5 p-6 space-y-3">
          <div className="flex items-center gap-1.5 text-[#FF3D00] font-mono text-[10px]">
            <ShieldAlert className="w-4 h-4 text-[#FF3D00]" />
            <span className="uppercase font-bold">Admin Security Notice</span>
          </div>
          <p className="text-[10px] text-[#A3A3A3] leading-relaxed">
            Ensure you keep your authorization tokens protected. Changing your username and email settings will update active local storage profiles but does not affect the master root configuration password.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsTab;
