import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Comment } from '../../../types';
import { useNovelStore } from '../../novels/store/novelStore';

export const useComments = (chapterId: string) => {
  const queryClient = useQueryClient();
  const triggerToast = useNovelStore((state) => state.triggerToast);

  // 1. Fetch comments from API
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', chapterId],
    queryFn: async () => {
      const res = await fetch(`/api/comments?chapterId=${encodeURIComponent(chapterId)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch comments');
      }
      return res.json();
    },
  });

  // 2. Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: async (payload: {
      chapterId: string;
      username: string;
      text: string;
      isUserRegistered: boolean;
      parentId?: number;
    }) => {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error('Failed to create comment');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments', chapterId] });
      triggerToast(data.parentId ? 'Reply posted.' : 'Comment posted.');
    },
    onError: (err) => {
      console.error(err);
      triggerToast('Failed to post comment.');
    },
  });

  // 3. Edit Comment Mutation
  const editCommentMutation = useMutation({
    mutationFn: async (payload: { commentId: number; text: string }) => {
      const res = await fetch(`/api/comments/${payload.commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: payload.text }),
      });
      if (!res.ok) {
        throw new Error('Failed to update comment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', chapterId] });
      triggerToast('Comment updated.');
    },
    onError: (err) => {
      console.error(err);
      triggerToast('Failed to edit comment.');
    },
  });

  // 4. Delete Comment Mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete comment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', chapterId] });
      triggerToast('Comment deleted.');
    },
    onError: (err) => {
      console.error(err);
      triggerToast('Failed to delete comment.');
    },
  });

  // 5. React to Comment Mutation
  const toggleReactionMutation = useMutation({
    mutationFn: async (payload: { commentId: number; type: 'like' | 'heart'; username: string }) => {
      const res = await fetch(`/api/comments/${payload.commentId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: payload.type, username: payload.username }),
      });
      if (!res.ok) {
        throw new Error('Failed to toggle reaction');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', chapterId] });
    },
    onError: (err) => {
      console.error(err);
      triggerToast('Failed to update reaction.');
    },
  });

  // Wrapper functions matching previous signature for clean UI integration
  const addComment = (user: string, text: string, isUserRegistered: boolean, parentId?: number) => {
    if (!user.trim() || !text.trim()) {
      triggerToast('Name and comment text cannot be empty.');
      return;
    }

    addCommentMutation.mutate({
      chapterId,
      username: user,
      text,
      isUserRegistered,
      parentId,
    });
  };

  const editComment = (commentId: number, newText: string) => {
    if (!newText.trim()) {
      triggerToast('Comment text cannot be empty.');
      return;
    }

    editCommentMutation.mutate({
      commentId,
      text: newText,
    });
  };

  const deleteComment = (commentId: number) => {
    deleteCommentMutation.mutate(commentId);
  };

  const toggleReaction = (commentId: number, type: 'likes' | 'hearts', username: string) => {
    const apiType = type === 'likes' ? 'like' : 'heart';
    toggleReactionMutation.mutate({
      commentId,
      type: apiType,
      username,
    });
  };

  return {
    comments,
    isLoading,
    addComment,
    editComment,
    deleteComment,
    toggleReaction,
    isSubmitting: addCommentMutation.isPending,
  };
};

export default useComments;
