import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquare, ShieldCheck, ThumbsUp, Heart, Reply, Edit2, Trash2, Save, X } from 'lucide-react';
import { useAuthStore } from '../../auth/store/authStore';
import { useNovelStore } from '../../novels/store/novelStore';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';
import { useComments } from '../hooks/useComments';
import { NovelMentionInput } from '../../novels/components/NovelMentionInput';
import { NovelMentionRenderer } from '../../novels/components/NovelMentionRenderer';
import { commentSchema, CommentInput } from '../types';
import { Comment } from '../../../types';
import { CONFIG } from '../../../config';

interface CommentSectionProps {
  chapterId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ chapterId }) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const setShowAuthModal = useAuthStore((state) => state.setShowAuthModal);
  const novels = useNovelStore((state) => state.novels);
  const setSelectedNovel = useNovelStore((state) => state.setSelectedNovel);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  
  const { comments, addComment, editComment, deleteComment, toggleReaction } = useComments(chapterId);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'liked'>('newest');

  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  // Input states for writing a top-level comment
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      user: currentUser ? currentUser.username : '',
      text: ''
    }
  });

  const textValue = watch('text') || '';

  // Sync user name when user logs in or out
  useEffect(() => {
    setValue('user', currentUser ? currentUser.username : '');
  }, [currentUser, setValue]);

  const onSubmit = (data: CommentInput) => {
    addComment(data.user, data.text, !!currentUser);
    reset({
      user: currentUser ? currentUser.username : '',
      text: ''
    });
  };

  // Helper to get total count of reactions on a comment
  const getReactionCount = (comm: Comment) => {
    const likes = comm.reactions?.likes?.length || 0;
    const hearts = comm.reactions?.hearts?.length || 0;
    return likes + hearts;
  };

  // Sort comments recursively
  const sortComments = (list: Comment[]): Comment[] => {
    const sorted = [...list];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => b.id - a.id);
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'liked') {
      sorted.sort((a, b) => getReactionCount(b) - getReactionCount(a));
    }
    return sorted.map(c => ({
      ...c,
      replies: c.replies ? sortComments(c.replies) : []
    }));
  };

  const sortedComments = sortComments(comments);

  // Render text and parse @mentions & [[Novel Links]]
  const parseCommentText = (text: string) => {
    // Helper to highlight username mentions (@name)
    const formatTextWithUserMentions = (txt: string) => {
      const parts = txt.split(/(@\w+)/g);
      return parts.map((part, idx) => {
        if (part.startsWith('@')) {
          return (
            <span key={idx} className="text-[#FF3D00] font-black font-mono">
              {part}
            </span>
          );
        }
        return part;
      });
    };

    try {
      if (text.trim().startsWith('[')) {
        const blocks = JSON.parse(text);
        if (Array.isArray(blocks)) {
          return blocks.map((block, idx) => {
            if (block.type === 'novel') {
              return (
                <NovelMentionRenderer
                  key={idx}
                  novelId={block.novelId}
                  title={block.title}
                />
              );
            }
            return <span key={idx}>{formatTextWithUserMentions(block.value || '')}</span>;
          });
        }
      }
    } catch (e) {
      // Fall through to legacy parsing
    }

    const parts = text.split(/(@\w+|\[\[.+?\]\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span key={idx} className="text-[#FF3D00] font-black font-mono">
            {part}
          </span>
        );
      }
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const title = part.slice(2, -2);
        const novel = novels.find(
          (n) =>
            n.title.toLowerCase() === title.toLowerCase() ||
            n.alternativeTitle.toLowerCase() === title.toLowerCase() ||
            n.romajiTitle.toLowerCase() === title.toLowerCase()
        );
        if (novel) {
          return (
            <NovelMentionRenderer
              key={idx}
              novelId={novel.id}
              title={novel.title}
            />
          );
        }
        return <span key={idx} className={`${themeStyles.accentText} font-mono`}>[[{title}]]</span>;
      }
      return part;
    });
  };

  // Recursive Comment Node Component
  interface CommentNodeProps {
    comm: Comment;
    level: number;
  }

  const CommentNode: React.FC<CommentNodeProps> = ({ comm, level }) => {
    const [replying, setReplying] = useState(false);
    const [editing, setEditing] = useState(false);
    const [replyUser, setReplyUser] = useState(currentUser ? currentUser.username : '');
    const [replyText, setReplyText] = useState('');
    const [editText, setEditText] = useState(comm.text);

    useEffect(() => {
      if (currentUser) {
        setReplyUser(currentUser.username);
      }
    }, [currentUser]);

    const isAuthor = currentUser && (currentUser.username === comm.user);
    const isAdmin = currentUser && (currentUser.email === CONFIG.ADMIN_EMAIL);
    const canModify = isAuthor || isAdmin;

    const handlePostReply = (e: React.FormEvent) => {
      e.preventDefault();
      if (!replyUser.trim() || !replyText.trim()) return;
      addComment(replyUser, replyText, !!currentUser, comm.id);
      setReplyText('');
      setReplying(false);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editText.trim()) return;
      editComment(comm.id, editText);
      setEditing(false);
    };

    const nextLevel = Math.min(level + 1, 2);

    const hasLiked = currentUser && comm.reactions?.likes?.includes(currentUser.username);
    const hasHearted = currentUser && comm.reactions?.hearts?.includes(currentUser.username);

    return (
      <div className={`space-y-3 ${level > 0 ? `border-l ${themeStyles.border} pl-4 sm:pl-6 ml-1 sm:ml-2` : ''}`}>
        <div className={`border ${themeStyles.border} p-4 ${themeStyles.cardBg} space-y-3 hover:border-current/30 transition-colors`}>
          {/* Header */}
          <div className={`flex justify-between items-center text-[10px] font-mono ${themeStyles.accentText}`}>
            <span className="font-extrabold text-[#FF3D00] uppercase flex items-center gap-1.5 truncate">
              {comm.user}
              {comm.isUserRegistered && (
                <span className="bg-[#FF3D00]/10 text-[#FF3D00] text-[8px] px-1.5 py-0.2 uppercase font-mono tracking-wider flex items-center gap-0.5 border border-[#FF3D00]/30">
                  <ShieldCheck className="w-2.5 h-2.5" /> Verified
                </span>
              )}
            </span>
            <span className="flex-shrink-0">{comm.date}</span>
          </div>

          {/* Body */}
          {editing ? (
            <form onSubmit={handleSaveEdit} className="space-y-2 font-mono">
              <NovelMentionInput
                value={editText}
                onChangeValue={setEditText}
                rows={2}
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-[#FF3D00] text-[#0A0A0A] font-bold py-1 px-3 uppercase text-[10px] hover:bg-white transition-colors cursor-pointer border-none flex items-center gap-1"
                >
                  <Save className="w-3 h-3" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setEditText(comm.text); }}
                  className={`border ${themeStyles.border} text-current font-bold py-1 px-3 uppercase text-[10px] hover:border-current transition-colors bg-transparent cursor-pointer flex items-center gap-1`}
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="text-xs sm:text-sm text-current leading-relaxed break-words whitespace-pre-wrap">
              {parseCommentText(comm.text)}
            </p>
          )}

          {/* Action toolbar */}
          <div className={`flex justify-between items-center text-[10px] font-mono ${themeStyles.accentText} border-t ${themeStyles.border}/40 pt-2.5`}>
            {/* Reactions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (!currentUser) { setShowAuthModal('login'); return; }
                  toggleReaction(comm.id, 'likes', currentUser.username);
                }}
                className={`flex items-center gap-1 hover:text-current bg-transparent border-none cursor-pointer p-0 font-mono text-[10px] ${
                  hasLiked ? 'text-[#FF3D00] font-bold' : ''
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-[#FF3D00]' : ''}`} />
                <span>Like ({comm.reactions?.likes?.length || 0})</span>
              </button>

              <button
                onClick={() => {
                  if (!currentUser) { setShowAuthModal('login'); return; }
                  toggleReaction(comm.id, 'hearts', currentUser.username);
                }}
                className={`flex items-center gap-1 hover:text-current bg-transparent border-none cursor-pointer p-0 font-mono text-[10px] ${
                  hasHearted ? 'text-[#FF3D00] font-bold' : ''
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${hasHearted ? 'fill-[#FF3D00]' : ''}`} />
                <span>Heart ({comm.reactions?.hearts?.length || 0})</span>
              </button>
            </div>

            {/* Replies and Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setReplying(!replying)}
                className="flex items-center gap-1 hover:text-current bg-transparent border-none cursor-pointer p-0 font-mono text-[10px]"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>

              {canModify && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1 hover:text-current bg-transparent border-none cursor-pointer p-0 font-mono text-[10px]"
                    title="Edit Comment"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => deleteComment(comm.id)}
                    className="flex items-center gap-1 hover:text-red-400 text-red-500 bg-transparent border-none cursor-pointer p-0 font-mono text-[10px]"
                    title="Delete Comment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Reply Form Overlay */}
          {replying && (
            <form onSubmit={handlePostReply} className={`space-y-2 ${themeStyles.bg} p-3 border ${themeStyles.border} font-mono text-xs`}>
              <div className={`flex items-center justify-between text-[9px] uppercase ${themeStyles.accentText} font-bold`}>
                <span>Reply to {comm.user}</span>
                <button
                  type="button"
                  onClick={() => setReplying(false)}
                  className="hover:text-current bg-transparent border-none cursor-pointer font-bold"
                >
                  Close
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Your Name..."
                  value={replyUser}
                  disabled={!!currentUser}
                  onChange={(e) => setReplyUser(e.target.value)}
                  className={`${themeStyles.cardBg} border ${themeStyles.border} p-2 text-xs text-current focus:outline-none focus:border-[#FF3D00] w-1/3 disabled:opacity-60 disabled:text-[#FF3D00]`}
                  required
                />
                <NovelMentionInput
                  placeholder="Write reply... Mention users with @username or novels with [[Novel Title]]"
                  value={replyText}
                  onChangeValue={setReplyText}
                  className="flex-1"
                  rows={1}
                  required
                />
                <button
                  type="submit"
                  className="bg-[#FF3D00] text-[#0A0A0A] hover:bg-white text-xs font-bold uppercase py-2 px-4 transition-colors cursor-pointer border-none"
                >
                  Post
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Recursive rendering of child replies */}
        {comm.replies && comm.replies.length > 0 && (
          <div className="space-y-3">
            {comm.replies.map((reply) => (
              <CommentNode key={reply.id} comm={reply} level={nextLevel} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section id="komentar" className={`border-t ${themeStyles.border} pt-12 space-y-6`}>
      {/* Header bar with sorting */}
      <div className={`flex items-center justify-between border-b ${themeStyles.border} pb-3`}>
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-[#FF3D00]" />
          <h3 className="text-base font-black uppercase tracking-tight text-current">
            Reader Discussion
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono ${themeStyles.accentText} uppercase font-bold`}>Sort By</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'liked')}
            className={`${themeStyles.bg} border ${themeStyles.border} px-2.5 py-1 text-[10px] font-mono text-current focus:outline-none focus:border-[#FF3D00] rounded-none uppercase font-bold`}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="liked">Most Liked</option>
          </select>
        </div>
      </div>

      {/* Main Comment Input Form */}
      <div className={`${themeStyles.cardBg} border ${themeStyles.border} p-4 space-y-4`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#FF3D00] font-extrabold uppercase flex items-center gap-1.5">
            {currentUser && <ShieldCheck className="w-4 h-4" />}
            Join the conversation
          </span>
          {!currentUser && (
            <button 
              onClick={() => setShowAuthModal('login')}
              className="text-[10px] font-mono text-[#FF3D00] underline hover:text-[#FAFAFA] bg-transparent border-none cursor-pointer"
            >
              Log in for a verified account badge
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1">
              <input 
                type="text" 
                disabled={!!currentUser}
                placeholder="Name / Alias..." 
                className={`${themeStyles.bg} border ${themeStyles.border} p-3 text-xs font-mono text-current focus:outline-none focus:border-[#FF3D00] disabled:opacity-75 disabled:text-[#FF3D00] disabled:font-bold`}
                {...register('user')}
              />
              {errors.user && (
                <p className="text-[10px] font-mono text-[#FF3D00]">{errors.user.message}</p>
              )}
            </div>
            <button 
              type="submit"
              className="bg-[#FF3D00] text-[#0A0A0A] hover:bg-white text-xs font-mono font-bold uppercase p-3 transition-colors cursor-pointer border-none h-11"
            >
              Post Comment
            </button>
          </div>
          <div className="flex flex-col space-y-1">
            <NovelMentionInput
              value={textValue}
              onChangeValue={(val) => setValue('text', val, { shouldValidate: true })}
              placeholder="Type your comment here... Mention other readers with @username or tag novels with [[Novel Title]]"
              rows={3}
            />
            {errors.text && (
              <p className="text-[10px] font-mono text-[#FF3D00]">{errors.text.message}</p>
            )}
          </div>
        </form>
      </div>

      {/* Render Comment Tree List */}
      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
        {sortedComments.length > 0 ? (
          sortedComments.map((comm) => (
            <CommentNode key={comm.id} comm={comm} level={0} />
          ))
        ) : (
          <p className={`text-xs font-mono ${themeStyles.accentText} text-center py-8`}>
            No comments on this chapter yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </section>
  );
};

export default CommentSection;

