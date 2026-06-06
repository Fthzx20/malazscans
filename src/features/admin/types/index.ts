import { z } from 'zod';

export const novelFormSchema = z.object({
  title: z.string().min(1, 'Judul utama wajib diisi'),
  alternativeTitle: z.string().min(1, 'Judul alternatif wajib diisi'),
  author: z.string().min(1, 'Penulis asli wajib diisi'),
  translator: z.string().min(1, 'Penerjemah wajib diisi'),
  genres: z.string().min(1, 'Genre utama wajib diisi'),
  synopsis: z.string().min(1, 'Sinopsis wajib diisi')
});

export const chapterFormSchema = z.object({
  novelId: z.string().min(1, 'Pilih novel sasaran'),
  title: z.string().min(1, 'Judul bab wajib diisi'),
  content: z.string().min(1, 'Isi konten bab wajib diisi')
});

export type NovelFormInput = z.infer<typeof novelFormSchema>;
export type ChapterFormInput = z.infer<typeof chapterFormSchema>;
