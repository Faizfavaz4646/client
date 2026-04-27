import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { workspaceSettingsService } from '@/lib/services/workspaceSettings.service';
import { MessageService } from '@/lib/services/message.service';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
  description: z.string().max(250, "Description cannot exceed 250 characters").optional(),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function GeneralTab({ workspaceId, workspace }: { workspaceId: string, workspace: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: workspace?.name || '',
      description: workspace?.description || '',
      avatarUrl: workspace?.avatarUrl || '',
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      await workspaceSettingsService.updateWorkspace(workspaceId, data);
      toast.success('Workspace settings updated successfully');
      // Reload to ensure layout.tsx and authStore fetch the fresh workspace details & avatar
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      setIsUploadingImage(true);
      const res = await MessageService.uploadMedia(file);
      if (res.data?.success || res.data?.data) {
        const url = res.data.data.attachment.url;
        setValue('avatarUrl', url, { shouldDirty: true });
        toast.success('Image uploaded! Click Save Changes to apply.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const currentAvatarUrl = watch('avatarUrl');

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-white tracking-tight">Overview</h3>
        <p className="text-sm text-slate-400 mt-1">Manage your workspace identity and appearance.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Workspace Logo Placeholder */}
        <div className="flex items-center gap-6 pb-6 border-b border-white/5">
           <div className="w-24 h-24 rounded-2xl bg-[#1c2242] border-2 border-indigo-500/20 shadow-inner flex items-center justify-center overflow-hidden text-3xl font-bold text-indigo-400 relative">
              {isUploadingImage && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
              {currentAvatarUrl ? (
                 <img src={currentAvatarUrl} alt="Workspace Logo" className="w-full h-full object-cover" />
              ) : (
                 workspace?.name?.charAt(0)?.toUpperCase() || 'W'
              )}
           </div>
           <div>
             <h4 className="text-sm font-semibold text-white mb-1">Workspace Logo</h4>
             <p className="text-xs text-slate-400 mb-3 max-w-xs">Upload an image to identify your workspace. Recommended size: 256x256px.</p>
             <input 
               type="file" 
               accept="image/*" 
               className="hidden" 
               ref={fileInputRef} 
               onChange={handleImageUpload} 
             />
             <button 
               type="button" 
               onClick={() => fileInputRef.current?.click()}
               disabled={isUploadingImage}
               className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors border border-white/5 disabled:opacity-50"
             >
                {isUploadingImage ? 'Uploading...' : 'Upload Image'}
             </button>
           </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Workspace Name</label>
            <input 
              {...register('name')}
              className="w-full bg-[#1c2242] border border-indigo-500/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
              placeholder="e.g. Acme Corp"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Tagline / Description</label>
            <textarea 
              {...register('description')}
              rows={3}
              className="w-full bg-[#1c2242] border border-indigo-500/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all custom-scrollbar resize-none"
              placeholder="What is this workspace about?"
            />
            {errors.description && <p className="text-red-400 text-xs mt-1.5">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Logo URL (Optional)</label>
            <input 
              {...register('avatarUrl')}
              className="w-full bg-[#1c2242] border border-indigo-500/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
              placeholder="https://..."
            />
            {errors.avatarUrl && <p className="text-red-400 text-xs mt-1.5">{errors.avatarUrl.message}</p>}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex justify-end">
           <button 
             type="submit" 
             disabled={!isDirty || isLoading}
             className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#1c2242] disabled:text-slate-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg active:scale-95"
           >
             {isLoading ? 'Saving...' : 'Save Changes'}
           </button>
        </div>

      </form>
    </div>
  );
}
