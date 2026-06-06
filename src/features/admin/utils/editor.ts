import { JSONContent } from '@tiptap/react';

export const convertTextToTiptapJSON = (text: string): JSONContent => {
  if (!text) {
    return {
      type: 'doc',
      content: []
    };
  }
  const paragraphs = text.split('\n');
  return {
    type: 'doc',
    content: paragraphs.map((para) => {
      return {
        type: 'paragraph',
        content: para ? [
          {
            type: 'text',
            text: para
          }
        ] : []
      };
    })
  };
};

export const getChapterJSON = (content: string): JSONContent => {
  if (!content) {
    return {
      type: 'doc',
      content: []
    };
  }
  try {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return JSON.parse(content);
    }
  } catch (e) {
    // Fail silently, fallback to conversion
  }
  return convertTextToTiptapJSON(content);
};
