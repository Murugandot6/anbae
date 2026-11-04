"use client";

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User, Camera, Save, Loader2, ArrowLeft, KeyRound, Plus, Copy, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface InviteCode {
  id: number;
  code: string;
  created_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    avatar_url: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile({
          username: data.username || '',
          full_name: data.full_name || '',
          avatar_url: data.avatar_url || ''
        });
      }
      setLoading(false);
    };

    fetchProfile();
    fetchInviteCodes();
  }, [user]);

  const fetchInviteCodes = async () => {
    setLoadingCodes(true);
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInviteCodes(data || []);
    } catch (error: any) {
      console.error("Error fetching invite codes:", error);
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const generateInviteCode = async () => {
    setGenerating(true);
    const newCode = `ISAI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .insert([{ code: newCode }])
        .select();

      if (error) throw error;
      
      toast.success(`Generated code: ${newCode}`);
      fetchInviteCodes();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate invite code");
    } finally {
      setGenerating(false);
    }
  };

  const deleteInviteCode = async (id: number) => {
    try {
      const { error } = await supabase
        .from('invite_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Invite code deleted");
      setInviteCodes(prev => prev.filter(item => item.id !== id));
    } catch (error: any) {
      toast.error(error.message || "Failed to delete invite code");
    }
  };

  const copyToClipboard = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-10 max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 md:mb-8 gap-1.5 hover:bg-accent/10 rounded-xl h-9 px-3 text-xs md:text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </Button>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-accent/5 p-1 rounded-2xl mb-6 md:mb-8 w-full grid grid-cols-2">
            <TabsTrigger value="profile" className="rounded-xl py-2.5 md:py-3 font-bold gap-1.5 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
              <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Edit Profile
            </TabsTrigger>
            <TabsTrigger value="invites" className="rounded-xl py-2.5 md:py-3 font-bold gap-1.5 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
              <KeyRound className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Invite Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-card border border-border rounded-3xl p-5 md:p-8 shadow-xl">
              <div className="flex flex-col items-center mb-8 md:mb-10">
                <div className="relative group">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-accent/10 border-4 border-primary/20 shadow-2xl">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <User className="w-9 h-9 md:w-12 md:h-12" />
                      </div>
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-primary text-white p-1.5 md:p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                    <Camera className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                  </button>
                </div>
                <h1 className="text-xl md:text-2xl font-black mt-4 tracking-tight">Edit Profile</h1>
                <p className="text-muted-foreground text-xs md:text-sm">{user?.email}</p>
              </div>

              <form onSubmit={handleSave} className="space-y-4 md:space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Username</Label>
                  <Input 
                    id="username"
                    value={profile.username}
                    onChange={(e) => setProfile({...profile, username: e.target.value})}
                    placeholder="Your unique username"
                    className="bg-accent/5 border-none h-11 md:h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                  <Input 
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    placeholder="Your display name"
                    className="bg-accent/5 border-none h-11 md:h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="avatar_url" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Avatar URL</Label>
                  <Input 
                    id="avatar_url"
                    value={profile.avatar_url}
                    onChange={(e) => setProfile({...profile, avatar_url: e.target.value})}
                    placeholder="https://example.com/avatar.jpg"
                    className="bg-accent/5 border-none h-11 md:h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 text-sm"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={saving}
                  className="w-full h-11 md:h-12 rounded-xl font-bold text-sm md:text-base shadow-xl shadow-primary/20 mt-4"
                >
                  {saving ? <Loader2 className="animate-spin mr-2 w-4.5 h-4.5 md:w-5 md:h-5" /> : <Save className="mr-2 w-4.5 h-4.5 md:w-5 md:h-5" />}
                  Save Changes
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="invites" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-card border border-border rounded-3xl p-5 md:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">Manage Invites</h2>
                  <p className="text-muted-foreground text-[10px] md:text-xs mt-0.5">Generate and share invite codes with friends.</p>
                </div>
                <Button 
                  onClick={generateInviteCode} 
                  disabled={generating}
                  className="rounded-xl gap-1.5 font-bold shadow-lg shadow-primary/20 text-xs h-10 w-full sm:w-auto"
                >
                  {generating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                  Generate Code
                </Button>
              </div>

              {loadingCodes ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : inviteCodes.length > 0 ? (
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {inviteCodes.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-accent/5 border border-border/50 hover:border-primary/20 transition-all"
                    >
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <KeyRound className="text-primary shrink-0 w-4 h-4 md:w-4.5 md:h-4.5" />
                        <span className="font-mono font-bold text-sm md:text-base tracking-wider truncate">{item.code}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => copyToClipboard(item.code, item.id)}
                          className="h-8 w-8 md:h-9 md:w-9 rounded-xl hover:bg-accent/10"
                        >
                          {copiedId === item.id ? <Check className="text-green-500 w-3.5 h-3.5 md:w-4 md:h-4" /> : <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteInviteCode(item.id)}
                          className="h-8 w-8 md:h-9 md:w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-accent/20 rounded-2xl">
                  <KeyRound size={32} className="text-muted-foreground/30 mb-2.5" />
                  <h3 className="font-bold text-xs md:text-sm mb-0.5">No invite codes generated</h3>
                  <p className="text-muted-foreground text-[10px] md:text-xs max-w-xs px-4">Click the button above to generate your first invite code.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Profile;