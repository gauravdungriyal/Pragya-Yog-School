import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Film, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [postType, setPostType] = useState('post'); // 'post' or 'tutorial'
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !user) return;

    setUploading(true);
    setError(null);

    try {
      const bucket = postType === 'post' ? 'posts' : 'tutorials';
      const table = postType === 'post' ? 'posts' : 'tutorials';

      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // 3. Save metadata to Database
      const dbData = postType === 'post' ? {
        user_id: user.id,
        media_url: publicUrl,
        caption: caption,
      } : {
        user_id: user.id,
        video_url: publicUrl,
        title: title || 'Untitled Tutorial',
        description: caption,
        music_name: 'Original Audio',
      };

      const { error: dbError } = await supabase.from(table).insert(dbData);

      if (dbError) throw dbError;

      // 4. Redirect
      navigate(postType === 'post' ? '/' : '/tutorials');
    } catch (err) {
      setError(err.message);
      console.error('Error uploading:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-pragya-sage p-6 text-white text-center">
          <h2 className="text-2xl font-serif font-bold">Create New</h2>
        </div>

        <form onSubmit={handleUpload} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-500 rounded-xl border border-red-100 text-sm">
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div className="flex p-1 bg-pragya-beige rounded-2xl">
            <button
              type="button"
              onClick={() => setPostType('post')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${postType === 'post' ? 'bg-white text-pragya-green shadow-sm' : 'text-pragya-dark/40 hover:text-pragya-dark/60'}`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Feed Post</span>
            </button>
            <button
              type="button"
              onClick={() => setPostType('tutorial')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${postType === 'tutorial' ? 'bg-white text-pragya-green shadow-sm' : 'text-pragya-dark/40 hover:text-pragya-dark/60'}`}
            >
              <Film className="w-4 h-4" />
              <span>Tutorial Reel</span>
            </button>
          </div>

          {/* Media Upload Area */}
          <div className={`relative aspect-square md:aspect-video rounded-2xl border-2 border-dashed border-pragya-mint flex flex-col items-center justify-center bg-pragya-beige/20 overflow-hidden group ${!file && 'cursor-pointer hover:bg-pragya-mint/10'}`}>
            {preview ? (
              <>
                {file?.type.startsWith('video') ? (
                  <video src={preview} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                )}
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-4 transition-transform group-hover:scale-105">
                <div className="p-6 bg-pragya-mint/40 rounded-full text-pragya-green">
                  <Upload className="w-10 h-10" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-pragya-dark/80 text-lg">Click to upload {postType === 'post' ? 'image' : 'video'}</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept={postType === 'post' ? 'image/*' : 'video/*'}
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          {/* Content Inputs */}
          <div className="space-y-4">
            {postType === 'tutorial' && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-pragya-dark/70 px-1">Tutorial Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master the Crow Pose"
                  className="w-full p-4 bg-white border border-pragya-mint/30 rounded-2xl focus:ring-4 focus:ring-pragya-mint/10 outline-none transition-all"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-bold text-pragya-dark/70 px-1">Description / Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's this about?"
                className="w-full p-4 bg-white border border-pragya-mint/30 rounded-2xl focus:ring-4 focus:ring-pragya-mint/10 outline-none transition-all min-h-[100px] resize-none"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full flex items-center justify-center gap-2 py-4 bg-pragya-green text-white rounded-2xl font-bold shadow-lg shadow-pragya-green/20 hover:bg-pragya-dark hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Publish to Community</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreatePost;
